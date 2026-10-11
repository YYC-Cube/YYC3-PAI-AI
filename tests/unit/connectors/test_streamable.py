"""Unit tests for streamable HTTP transport helpers."""

from __future__ import annotations

from octop.infra.connectors.gateway.streamable import (
    SessionStore,
    client_accepts_streamable,
    is_supported_protocol_version,
)

SUPPORTED = ["2024-11-05", "2025-03-26", "2025-06-18"]


def test_accepts_missing_header_is_tolerated() -> None:
    assert client_accepts_streamable(None) is True


def test_accepts_wildcard() -> None:
    assert client_accepts_streamable("*/*") is True


def test_accepts_json_and_sse() -> None:
    assert client_accepts_streamable("application/json") is True
    assert client_accepts_streamable("text/event-stream") is True
    assert client_accepts_streamable("application/json, text/event-stream") is True


def test_accepts_quality_params() -> None:
    assert client_accepts_streamable("text/event-stream;q=0.9, application/json;q=0.1") is True


def test_rejects_unrelated_media_type() -> None:
    assert client_accepts_streamable("text/html") is False
    assert client_accepts_streamable("application/xml, text/html") is False


def test_protocol_version_support() -> None:
    assert is_supported_protocol_version("2025-03-26", SUPPORTED) is True
    assert is_supported_protocol_version("1999-01-01", SUPPORTED) is False
    assert is_supported_protocol_version("", SUPPORTED) is False


def test_session_store_lifecycle() -> None:
    store = SessionStore()
    session_id = store.create()
    assert session_id
    assert store.validate(session_id) is True
    assert store.validate("bogus") is False
    assert store.drop(session_id) is True
    assert store.validate(session_id) is False
    assert store.drop(session_id) is False
    assert store.drop("bogus") is False


def test_session_store_ids_are_unique() -> None:
    store = SessionStore()
    ids = {store.create() for _ in range(50)}
    assert len(ids) == 50
