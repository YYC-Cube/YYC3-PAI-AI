"""Integration tests for the family task loop (dispatch → accept → complete).

Covers v22 behavior on top of the base task lifecycle API:
admin dispatch to another member, role-based listing, actor-aware transitions,
and visibility rules between household members.
"""

from __future__ import annotations

from tests.support.auth import create_user, resolve_user_id


async def test_admin_dispatch_and_assignee_flow(env_admin_alice):
    c, srv, admin_auth, alice_auth = env_admin_alice
    alice_id = await resolve_user_id(c, admin_auth, "alice")

    # admin (家长) dispatches a task to alice
    r = await c.post(
        "/api/tasks",
        headers=admin_auth,
        json={
            "title": "倒垃圾",
            "instruction": "晚饭后倒垃圾",
            "assignee_user_id": alice_id,
            "due_at": 1_800_000_000,
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["assignee_user_id"] == alice_id
    assert body["due_at"] == 1_800_000_000
    tid = body["task_id"]

    # alice sees it in her assigned bucket (and in the default "all" view)
    r = await c.get("/api/tasks", params={"role": "assigned"}, headers=alice_auth)
    assert r.status_code == 200
    assert [t["task_id"] for t in r.json()["tasks"]] == [tid]
    r = await c.get("/api/tasks", headers=alice_auth)
    assert tid in [t["task_id"] for t in r.json()["tasks"]]
    # but not in her created bucket
    r = await c.get("/api/tasks", params={"role": "created"}, headers=alice_auth)
    assert r.status_code == 200
    assert r.json()["tasks"] == []

    # creator sees the same task in the created bucket
    r = await c.get("/api/tasks", params={"role": "created"}, headers=admin_auth)
    assert tid in [t["task_id"] for t in r.json()["tasks"]]

    # alice accepts; admin cannot complete on her behalf; alice completes
    r = await c.post(f"/api/tasks/{tid}/transition", headers=alice_auth, json={"status": "working"})
    assert r.status_code == 200, r.text
    r = await c.post(
        f"/api/tasks/{tid}/transition", headers=admin_auth, json={"status": "completed"}
    )
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "TASK_INVALID_TRANSITION"
    r = await c.post(
        f"/api/tasks/{tid}/transition",
        headers=alice_auth,
        json={"status": "completed", "result": "已完成"},
    )
    assert r.status_code == 200
    assert r.json()["result"] == "已完成"


async def test_dispatch_permission_and_unknown_assignee(env_admin_alice):
    c, srv, admin_auth, alice_auth = env_admin_alice
    admin_id = await resolve_user_id(c, admin_auth, "admin")

    # a member cannot dispatch to someone else (家长制: admin only)
    r = await c.post(
        "/api/tasks",
        headers=alice_auth,
        json={"title": "帮我", "assignee_user_id": admin_id},
    )
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"

    # unknown assignee
    r = await c.post(
        "/api/tasks",
        headers=admin_auth,
        json={"title": "x", "assignee_user_id": 999_999},
    )
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "TASK_ASSIGNEE_NOT_FOUND"

    # a member assigning to herself is a personal task and stays allowed
    alice_id = await resolve_user_id(c, admin_auth, "alice")
    r = await c.post(
        "/api/tasks",
        headers=alice_auth,
        json={"title": "个人备忘", "assignee_user_id": alice_id},
    )
    assert r.status_code == 201


async def test_creator_recall_and_assignee_reject(env_admin_alice):
    c, srv, admin_auth, alice_auth = env_admin_alice
    alice_id = await resolve_user_id(c, admin_auth, "alice")

    # creator recalls (撤回)
    tid = (
        await c.post(
            "/api/tasks",
            headers=admin_auth,
            json={"title": "临时任务", "assignee_user_id": alice_id},
        )
    ).json()["task_id"]
    r = await c.post(
        f"/api/tasks/{tid}/transition", headers=admin_auth, json={"status": "canceled"}
    )
    assert r.status_code == 200

    # assignee rejects (拒绝)
    tid2 = (
        await c.post(
            "/api/tasks",
            headers=admin_auth,
            json={"title": "不想做", "assignee_user_id": alice_id},
        )
    ).json()["task_id"]
    r = await c.post(
        f"/api/tasks/{tid2}/transition", headers=alice_auth, json={"status": "canceled"}
    )
    assert r.status_code == 200


async def test_dispatch_invisible_to_unrelated_member(env_admin_alice):

    c, srv, admin_auth, alice_auth = env_admin_alice
    bob_auth = await create_user(c, admin_auth, username="bob")
    alice_id = await resolve_user_id(c, admin_auth, "alice")

    tid = (
        await c.post(
            "/api/tasks",
            headers=admin_auth,
            json={"title": "家务", "assignee_user_id": alice_id},
        )
    ).json()["task_id"]

    # bob is neither creator nor assignee: invisible, and cannot transition
    r = await c.get(f"/api/tasks/{tid}", headers=bob_auth)
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "TASK_NOT_FOUND"
    r = await c.post(f"/api/tasks/{tid}/transition", headers=bob_auth, json={"status": "working"})
    assert r.status_code == 404
    r = await c.get("/api/tasks", headers=bob_auth)
    assert r.json()["tasks"] == []


async def test_invalid_role_rejected(env_admin_alice):
    c, srv, admin_auth, alice_auth = env_admin_alice
    r = await c.get("/api/tasks", params={"role": "nope"}, headers=alice_auth)
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "TASK_INVALID_STATUS"
