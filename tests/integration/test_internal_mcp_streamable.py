"""Integration tests for the internal MCP streamable HTTP transport."""

from __future__ import annotations

from typing import Any

from octop.infra.connectors.gateway.manifest import verify_manifest_signature
from octop.infra.connectors.gateway.streamable import (
    MCP_PROTOCOL_HEADER,
    MCP_SESSION_HEADER,
)

INITIALIZE = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {}},
}


async def _create_gateway_instance(
    c: Any, srv: Any, auth: dict[str, str], kind: str = "qq-music"
) -> tuple[str, str]:
    created = await c.post(
        "/api/connector-instances",
        headers=auth,
        json={"kind": kind, "display_name": kind, "credentials": {"api_key": "qmk-synthetic"}},
    )
    assert created.status_code == 201
    instance_id = created.json()["instance_id"]
    from octop.api.routers.internal_mcp import _service

    token = _service(srv).decrypt(instance_id)["internal_token"]
    return instance_id, token


async def _initialize(c: Any, path: str, token: str) -> Any:
    resp = await c.post(path, params={"token": token}, json=INITIALIZE)
    assert resp.status_code == 200
    return resp


async def test_initialize_issues_session_and_negotiates_version(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)
    path = f"/api/internal/mcp/qq-music/{instance_id}"

    resp = await _initialize(c, path, token)
    session_id = resp.headers.get(MCP_SESSION_HEADER)
    assert session_id
    assert resp.json()["result"]["protocolVersion"] == "2025-03-26"


async def test_initialize_rejects_unsupported_protocol_header(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)
    path = f"/api/internal/mcp/qq-music/{instance_id}"

    resp = await c.post(
        path,
        params={"token": token},
        json=INITIALIZE,
        headers={MCP_PROTOCOL_HEADER: "1999-01-01"},
    )
    assert resp.status_code == 400


async def test_post_rejects_unacceptable_accept_header(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)
    path = f"/api/internal/mcp/qq-music/{instance_id}"

    resp = await c.post(
        path, params={"token": token}, json=INITIALIZE, headers={"Accept": "text/html"}
    )
    assert resp.status_code == 406


async def test_tools_list_requires_valid_session(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)
    path = f"/api/internal/mcp/qq-music/{instance_id}"
    session_id = (await _initialize(c, path, token)).headers[MCP_SESSION_HEADER]

    listed = await c.post(
        path,
        params={"token": token},
        json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        headers={MCP_SESSION_HEADER: session_id},
    )
    assert listed.status_code == 200
    tools = listed.json()["result"]["tools"]
    assert {"search_music", "list_charts"} <= {t["name"] for t in tools}

    bogus = await c.post(
        path,
        params={"token": token},
        json={"jsonrpc": "2.0", "id": 3, "method": "tools/list"},
        headers={MCP_SESSION_HEADER: "bogus"},
    )
    assert bogus.status_code == 400


async def test_get_stream_validates_session(env) -> None:
    from starlette.requests import Request as StarletteRequest

    from octop.api.routers.internal_mcp import internal_mcp_get

    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)
    path = f"/api/internal/mcp/qq-music/{instance_id}"
    session_id = (await _initialize(c, path, token)).headers[MCP_SESSION_HEADER]

    missing = await c.get(path, params={"token": token})
    assert missing.status_code == 405

    unknown = await c.get(path, params={"token": token}, headers={MCP_SESSION_HEADER: "bogus"})
    assert unknown.status_code == 404

    # httpx's ASGI transport buffers the whole body, so an infinite SSE stream
    # cannot be consumed over the test client; call the endpoint directly and
    # assert on the streaming response it would return.
    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": [(b"mcp-session-id", session_id.encode())],
        "query_string": f"token={token}".encode(),
    }
    resp = await internal_mcp_get(
        kind="qq-music",
        instance_id=instance_id,
        request=StarletteRequest(scope),
        token=token,
        server=srv,
    )
    assert resp.status_code == 200
    assert resp.media_type == "text/event-stream"


async def test_delete_ends_session(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)
    path = f"/api/internal/mcp/qq-music/{instance_id}"
    session_id = (await _initialize(c, path, token)).headers[MCP_SESSION_HEADER]

    unknown = await c.delete(path, params={"token": token}, headers={MCP_SESSION_HEADER: "bogus"})
    assert unknown.status_code == 404

    ended = await c.delete(path, params={"token": token}, headers={MCP_SESSION_HEADER: session_id})
    assert ended.status_code == 204

    after = await c.get(path, params={"token": token}, headers={MCP_SESSION_HEADER: session_id})
    assert after.status_code == 404


async def test_signed_tool_manifest(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth)

    denied = await c.get(
        f"/api/internal/mcp/qq-music/{instance_id}/manifest", params={"token": "wrong"}
    )
    assert denied.status_code == 401

    resp = await c.get(
        f"/api/internal/mcp/qq-music/{instance_id}/manifest", params={"token": token}
    )
    assert resp.status_code == 200
    manifest = resp.json()
    assert {"search_music", "list_charts"} <= {t["name"] for t in manifest["tools"]}
    assert manifest["instanceId"] == instance_id
    assert verify_manifest_signature(manifest, token) is True

    tampered = dict(manifest)
    tampered["tools"] = []
    assert verify_manifest_signature(tampered, token) is False


async def test_manifest_not_available_for_qcc(env) -> None:
    c, srv, auth = env
    instance_id, token = await _create_gateway_instance(c, srv, auth, kind="qcc")

    resp = await c.get(f"/api/internal/mcp/qcc/{instance_id}/manifest", params={"token": token})
    assert resp.status_code == 400
