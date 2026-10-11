"""Streamable HTTP transport helpers for the internal MCP gateway.

Pure logic only (no I/O): session bookkeeping, content negotiation and
protocol version negotiation for the MCP streamable HTTP transport
(spec 2025-03-26 and later).
"""

from __future__ import annotations

import secrets
import threading
from collections.abc import Iterable

MCP_SESSION_HEADER = "mcp-session-id"
MCP_PROTOCOL_HEADER = "mcp-protocol-version"

JSON_CONTENT_TYPE = "application/json"
SSE_CONTENT_TYPE = "text/event-stream"


def client_accepts_streamable(accept_header: str | None) -> bool:
    """True when the client Accept header allows JSON and/or SSE responses.

    Tolerant by design: a missing header or a wildcard ``*/*`` is treated as
    acceptable, mirroring the MCP spec guidance that servers SHOULD respond as
    if both media types were accepted. Only an explicit list of other media
    types is rejected (caller maps this to HTTP 406).
    """
    if accept_header is None:
        return True
    accepted = {
        media_type.split(";", 1)[0].strip().lower() for media_type in accept_header.split(",")
    }
    if not accepted or "*" in accepted or "*/*" in accepted:
        return True
    return bool(accepted & {JSON_CONTENT_TYPE, SSE_CONTENT_TYPE})


def is_supported_protocol_version(requested: str, supported: Iterable[str]) -> bool:
    """True when the requested MCP protocol version is supported."""
    requested = requested.strip()
    return any(version == requested for version in supported)


class SessionStore:
    """In-memory registry of live streamable HTTP sessions."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._sessions: set[str] = set()

    def create(self) -> str:
        session_id = secrets.token_urlsafe(16)
        with self._lock:
            self._sessions.add(session_id)
        return session_id

    def validate(self, session_id: str) -> bool:
        with self._lock:
            return session_id in self._sessions

    def drop(self, session_id: str) -> bool:
        with self._lock:
            if session_id not in self._sessions:
                return False
            self._sessions.remove(session_id)
            return True
