"""Integration tests for the task lifecycle API."""

from __future__ import annotations


async def test_create_and_get_task(env):
    c, _, auth = env
    r = await c.post(
        "/api/tasks",
        headers=auth,
        json={"title": "家庭采购", "instruction": "买牛奶和鸡蛋", "agent_id": "main"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "submitted"
    assert body["title"] == "家庭采购"
    assert body["agent_id"] == "main"
    assert body["result"] is None

    got = await c.get(f"/api/tasks/{body['task_id']}", headers=auth)
    assert got.status_code == 200
    assert got.json()["task_id"] == body["task_id"]


async def test_tasks_require_auth(env):
    c, _, auth = env
    assert (await c.get("/api/tasks")).status_code == 401
    assert (await c.post("/api/tasks", json={"title": "x"})).status_code == 401
    r = await c.post("/api/tasks", headers=auth, json={"title": "x"})
    assert r.status_code == 201
    tid = r.json()["task_id"]
    assert (await c.get(f"/api/tasks/{tid}")).status_code == 401
    assert (
        await c.post(f"/api/tasks/{tid}/transition", json={"status": "working"})
    ).status_code == 401


async def test_full_dispatch_loop(env):
    c, _, auth = env
    tid = (await c.post("/api/tasks", headers=auth, json={"title": "t"})).json()["task_id"]

    for status in ("working", "input_required", "working"):
        r = await c.post(f"/api/tasks/{tid}/transition", headers=auth, json={"status": status})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == status

    r = await c.post(
        f"/api/tasks/{tid}/transition",
        headers=auth,
        json={"status": "completed", "result": "搞定"},
    )
    assert r.status_code == 200
    assert r.json()["result"] == "搞定"

    # terminal state is absorbing
    r = await c.post(f"/api/tasks/{tid}/transition", headers=auth, json={"status": "working"})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "TASK_INVALID_TRANSITION"


async def test_invalid_transition_and_unknown_status(env):
    c, _, auth = env
    tid = (await c.post("/api/tasks", headers=auth, json={"title": "t"})).json()["task_id"]

    r = await c.post(f"/api/tasks/{tid}/transition", headers=auth, json={"status": "completed"})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "TASK_INVALID_TRANSITION"

    r = await c.get("/api/tasks", params={"status": "bogus"}, headers=auth)
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "TASK_INVALID_STATUS"


async def test_unknown_task_is_404(env):
    c, _, auth = env
    r = await c.get("/api/tasks/no-such-task", headers=auth)
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "TASK_NOT_FOUND"


async def test_tasks_are_user_scoped(env):
    from tests.support.auth import create_user

    c, _, auth = env
    tid = (await c.post("/api/tasks", headers=auth, json={"title": "t"})).json()["task_id"]
    bob = await create_user(c, auth, username="bob")
    r = await c.get(f"/api/tasks/{tid}", headers=bob)
    assert r.status_code == 404
    r = await c.get("/api/tasks", headers=bob)
    assert r.status_code == 200
    assert r.json()["tasks"] == []
