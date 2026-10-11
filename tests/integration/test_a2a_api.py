"""tests/integration/test_a2a_api.py"""

from __future__ import annotations


async def test_well_known_card_is_public(env):
    c, _, auth = env
    r = await c.get("/.well-known/agent.json")
    assert r.status_code == 200
    card = r.json()
    assert card["protocolVersion"] == "1.0"
    assert card["name"] == "YYC3-Pai"
    assert card["url"] == "http://testserver/api/a2a"
    assert card["authentication"]["schemes"] == ["Bearer"]
    assert card["capabilities"]["streaming"] is True
    assert card["skills"] == []


async def test_card_index_requires_auth(env):
    c, _, auth = env
    r = await c.get("/api/a2a/agents")
    assert r.status_code == 401

    r = await c.get("/api/a2a/agents", headers=auth)
    assert r.status_code == 200
    body = r.json()
    assert body["protocolVersion"] == "1.0"
    assert len(body["agents"]) >= 1
    ref = body["agents"][0]
    assert ref["cardUrl"] == f"http://testserver/api/a2a/agents/{ref['agentId']}/card"


async def test_per_agent_card(env):
    c, _, auth = env
    idx = (await c.get("/api/a2a/agents", headers=auth)).json()
    agent_id = idx["agents"][0]["agentId"]
    name = idx["agents"][0]["name"]

    r = await c.get(f"/api/a2a/agents/{agent_id}/card", headers=auth)
    assert r.status_code == 200
    card = r.json()
    assert card["name"] == name
    assert card["url"] == f"http://testserver/api/a2a/agents/{agent_id}"
    assert card["protocolVersion"] == "1.0"
    assert card["authentication"]["schemes"] == ["Bearer"]
    assert card["skills"] == []


async def test_per_agent_card_requires_auth(env):
    c, _, auth = env
    idx = (await c.get("/api/a2a/agents", headers=auth)).json()
    agent_id = idx["agents"][0]["agentId"]
    r = await c.get(f"/api/a2a/agents/{agent_id}/card")
    assert r.status_code == 401


async def test_unknown_agent_card_is_404(env):
    c, _, auth = env
    r = await c.get("/api/a2a/agents/no-such-agent/card", headers=auth)
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "AGENT_NOT_FOUND"
