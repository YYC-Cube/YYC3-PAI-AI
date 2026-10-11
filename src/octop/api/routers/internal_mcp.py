"""Internal HTTP MCP endpoints for YYC3-Pai-hosted connector gateways."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from mcp.shared.version import SUPPORTED_PROTOCOL_VERSIONS

from octop.api.deps import get_server
from octop.infra.connectors.gateway.manifest import build_signed_manifest
from octop.infra.connectors.gateway.protocol import handle_mcp_request
from octop.infra.connectors.gateway.registry import mcp_tools_for_kind
from octop.infra.connectors.gateway.streamable import (
    MCP_PROTOCOL_HEADER,
    MCP_SESSION_HEADER,
    SessionStore,
    client_accepts_streamable,
    is_supported_protocol_version,
)
from octop.infra.connectors.service import ConnectorService
from octop.infra.errors import ErrorCode, OctopError

logger = logging.getLogger(__name__)

router = APIRouter()

# Live streamable HTTP sessions created by ``initialize`` (process-local;
# clients re-initialize after a server restart).
_sessions = SessionStore()


def _service(server: Any) -> ConnectorService:
    return ConnectorService(
        repo=server.services.repos.connector_repo,
        secret_repo=server.services.secret_repo,
        settings_repo=server.services.settings_repo,
        config=server.services.config,
    )


def _negotiate_initialize_result(body: dict[str, Any], resp: dict[str, Any]) -> dict[str, Any]:
    if body.get("method") != "initialize":
        return resp
    result = resp.get("result")
    if not isinstance(result, dict):
        return resp
    params = body.get("params") or {}
    requested = str(params.get("protocolVersion") or "").strip()
    if requested in SUPPORTED_PROTOCOL_VERSIONS:
        result["protocolVersion"] = requested
    return resp


def _require_instance(server: Any, kind: str, instance_id: str, *, active_only: bool) -> Any:
    inst = server.services.repos.connector_repo.get(instance_id)
    if inst is None or inst.kind != kind or (active_only and inst.status != "active"):
        raise OctopError(ErrorCode.CONNECTOR_NOT_FOUND, "instance not found")
    return inst


def _require_creds(svc: ConnectorService, instance_id: str, token: str) -> dict[str, Any]:
    creds = svc.verify_internal_token(instance_id, token)
    if creds is None:
        raise OctopError(ErrorCode.AUTH_FAILED, "invalid internal token")
    return creds


def _unknown_session() -> JSONResponse:
    return JSONResponse(status_code=404, content={"error": "unknown mcp-session-id"})


@router.post(
    "/internal/mcp/{kind}/{instance_id}",
    summary="MCP streamable HTTP endpoint (JSON-RPC)",
    description=(
        "Serves MCP JSON-RPC over streamable HTTP for one gateway connector "
        "instance. Issues an mcp-session-id on initialize; subsequent requests "
        "must carry it. Authenticated with the per-instance internal token."
    ),
)
async def internal_mcp_post(
    kind: str,
    instance_id: str,
    request: Request,
    token: str = Query(...),
    server: Any = Depends(get_server),
) -> Response:
    _require_instance(server, kind, instance_id, active_only=True)
    svc = _service(server)
    creds = _require_creds(svc, instance_id, token)

    if not client_accepts_streamable(request.headers.get("accept")):
        return JSONResponse(
            status_code=406,
            content={"error": "Accept must include application/json or text/event-stream"},
        )
    protocol = request.headers.get(MCP_PROTOCOL_HEADER)
    if protocol and not is_supported_protocol_version(protocol, SUPPORTED_PROTOCOL_VERSIONS):
        return JSONResponse(
            status_code=400,
            content={"error": f"unsupported mcp-protocol-version: {protocol}"},
        )

    try:
        body = await request.json()
    except json.JSONDecodeError as exc:
        raise OctopError(ErrorCode.CONNECTOR_INVALID_CREDENTIALS, "invalid JSON body") from exc
    if not isinstance(body, dict):
        raise OctopError(ErrorCode.CONNECTOR_INVALID_CREDENTIALS, "expected JSON object")

    method = str(body.get("method") or "")
    if method == "notifications/initialized":
        return Response(status_code=202)

    session_id = request.headers.get(MCP_SESSION_HEADER)
    if method == "initialize":
        session_id = _sessions.create()
    elif session_id and not _sessions.validate(session_id):
        return JSONResponse(status_code=400, content={"error": "unknown mcp-session-id"})

    if kind == "qcc":
        resp = await svc.handle_qcc_request(instance_id, body)
    else:
        resp = await asyncio.to_thread(handle_mcp_request, kind=kind, creds=creds, body=body)
    if not resp:
        return Response(status_code=202)

    resp = _negotiate_initialize_result(body, resp)
    headers = {"content-type": "application/json"}
    if session_id:
        headers[MCP_SESSION_HEADER] = session_id
    if protocol:
        headers[MCP_PROTOCOL_HEADER] = protocol
    return JSONResponse(content=resp, headers=headers)


@router.get(
    "/internal/mcp/{kind}/{instance_id}",
    summary="MCP streamable HTTP server→client SSE channel",
    description=(
        "Long-lived SSE stream opened by streamable HTTP clients after "
        "initialize. Requires a valid mcp-session-id; unknown sessions get 404."
    ),
)
async def internal_mcp_get(
    kind: str,
    instance_id: str,
    request: Request,
    token: str = Query(...),
    server: Any = Depends(get_server),
) -> Response:
    """Streamable HTTP clients open a long-lived GET SSE channel after initialize."""
    _require_instance(server, kind, instance_id, active_only=False)
    svc = _service(server)
    _require_creds(svc, instance_id, token)

    session_id = request.headers.get(MCP_SESSION_HEADER)
    if not session_id:
        return JSONResponse(
            status_code=405,
            content={"error": "missing mcp-session-id"},
        )
    if not _sessions.validate(session_id):
        return _unknown_session()

    async def _sse_keepalive() -> Any:
        # Priming event so streamable-http clients attach successfully.
        yield "event: message\ndata: \n\n"
        while True:
            await asyncio.sleep(3600)

    return StreamingResponse(
        _sse_keepalive(),
        media_type="text/event-stream",
        headers={"cache-control": "no-cache", "connection": "keep-alive"},
    )


@router.delete(
    "/internal/mcp/{kind}/{instance_id}",
    summary="End an MCP streamable HTTP session",
    description="Streamable HTTP clients DELETE to terminate their session (mcp-session-id header).",
)
async def internal_mcp_delete(
    kind: str,
    instance_id: str,
    request: Request,
    token: str = Query(...),
    server: Any = Depends(get_server),
) -> Response:
    """Streamable HTTP clients may DELETE to end a session."""
    _require_instance(server, kind, instance_id, active_only=False)
    svc = _service(server)
    _require_creds(svc, instance_id, token)
    session_id = request.headers.get(MCP_SESSION_HEADER)
    if not session_id or not _sessions.drop(session_id):
        return _unknown_session()
    return Response(status_code=204)


@router.get(
    "/internal/mcp/{kind}/{instance_id}/manifest",
    summary="Signed tool manifest for a gateway connector instance",
    description=(
        "Publishes the instance's tool list as an HMAC-SHA256 signed manifest "
        "(keyed by the internal token) so clients can verify integrity and "
        "provenance. Not available for upstream-proxied kinds such as qcc."
    ),
)
async def internal_mcp_manifest(
    kind: str,
    instance_id: str,
    token: str = Query(...),
    server: Any = Depends(get_server),
) -> Response:
    _require_instance(server, kind, instance_id, active_only=False)
    svc = _service(server)
    creds = _require_creds(svc, instance_id, token)
    if kind == "qcc":
        return JSONResponse(
            status_code=400,
            content={"error": "signed manifest is not available for upstream-proxied kinds"},
        )
    tools = mcp_tools_for_kind(kind)
    manifest = build_signed_manifest(
        kind=kind,
        instance_id=instance_id,
        tools=tools,
        protocol_version="2024-11-05",
        key=str(creds.get("internal_token") or ""),
        signed_at=int(time.time()),
    )
    return JSONResponse(content=manifest)
