"""POST /api/skills/synthesize — trajectory → skill draft endpoint."""

from __future__ import annotations

from typing import Any

_URL = "/api/skills/synthesize"


async def _create_thread(client: Any, auth: dict[str, str], agent_id: str) -> str:
    response = await client.post(f"/api/agents/{agent_id}/threads", headers=auth)
    assert response.status_code == 201, response.text
    return str(response.json()["thread_id"])


def _feed_tool_pair(srv: Any, agent_id: str, thread_id: str) -> None:
    service = srv.app_runtime.trajectory_service
    assert service is not None
    service.observe_chunk(agent_id, thread_id, {"type": "user", "content": "please read a.py"})
    service.observe_chunk(
        agent_id,
        thread_id,
        {"type": "tool_call_chunk", "id": "call_1", "name": "read_file", "args": {"path": "a.py"}},
    )
    service.observe_chunk(
        agent_id,
        thread_id,
        {"type": "tool_result", "id": "call_1", "name": "read_file", "content": "file contents"},
    )


async def test_owner_synthesizes_draft_from_trajectory(env_alice_bob_agent: Any) -> None:
    client, srv, alice_auth, _bob_auth, agent_id = env_alice_bob_agent
    thread_id = await _create_thread(client, alice_auth, agent_id)
    _feed_tool_pair(srv, agent_id, thread_id)

    response = await client.post(
        _URL,
        headers=alice_auth,
        json={"thread_id": thread_id, "title": "Read A File"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["name"] == "read-a-file"
    markdown = body["markdown"]
    assert markdown.startswith("---\nname: read-a-file\n")
    assert "read_file" in markdown
    assert thread_id in markdown
    # Draft only — nothing was persisted into any skill store.
    skills = await client.get(f"/api/agents/{agent_id}/skills", headers=alice_auth)
    assert skills.status_code == 200
    assert all(item["slug"] != "read-a-file" for item in skills.json())


async def test_non_owner_cannot_synthesize(env_alice_bob_agent: Any) -> None:
    client, srv, alice_auth, bob_auth, agent_id = env_alice_bob_agent
    thread_id = await _create_thread(client, alice_auth, agent_id)
    _feed_tool_pair(srv, agent_id, thread_id)

    response = await client.post(
        _URL,
        headers=bob_auth,
        json={"thread_id": thread_id, "title": "Steal It"},
    )
    assert response.status_code == 404, response.text


async def test_thread_without_tool_calls_returns_empty_error(env_alice_bob_agent: Any) -> None:
    client, srv, alice_auth, _bob_auth, agent_id = env_alice_bob_agent
    thread_id = await _create_thread(client, alice_auth, agent_id)
    service = srv.app_runtime.trajectory_service
    assert service is not None
    service.observe_chunk(agent_id, thread_id, {"type": "user", "content": "just chatting"})

    response = await client.post(
        _URL,
        headers=alice_auth,
        json={"thread_id": thread_id, "title": "No Tools"},
    )
    assert response.status_code == 400, response.text
    assert response.json()["error"]["code"] == "SKILL_SYNTHESIS_EMPTY"


async def test_requires_authentication(env_alice_bob_agent: Any) -> None:
    client, _srv, alice_auth, _bob_auth, agent_id = env_alice_bob_agent
    thread_id = await _create_thread(client, alice_auth, agent_id)
    response = await client.post(
        _URL,
        json={"thread_id": thread_id, "title": "X"},
    )
    assert response.status_code == 401
