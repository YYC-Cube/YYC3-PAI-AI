"""Unit tests for signed tool manifest publishing."""

from __future__ import annotations

from typing import Any

from octop.infra.connectors.gateway.manifest import (
    build_signed_manifest,
    canonical_manifest_payload,
    sign_manifest,
    verify_manifest_signature,
)

TOOLS = [
    {"name": "search_music", "inputSchema": {"type": "object"}},
    {"name": "list_charts", "inputSchema": {"type": "object"}},
]


def _build(key: str = "tok") -> dict[str, Any]:
    return build_signed_manifest(
        kind="qq-music",
        instance_id="inst-1",
        tools=TOOLS,
        protocol_version="2024-11-05",
        key=key,
        signed_at=1_800_000_000,
    )


def test_manifest_shape() -> None:
    manifest = _build()
    assert manifest["kind"] == "qq-music"
    assert manifest["instanceId"] == "inst-1"
    assert manifest["tools"] == TOOLS
    assert manifest["signatureAlgorithm"] == "hmac-sha256"
    assert manifest["signedAt"] == 1_800_000_000
    assert len(manifest["signature"]) == 64


def test_signature_verifies() -> None:
    assert verify_manifest_signature(_build(), "tok") is True


def test_signature_is_deterministic() -> None:
    a = _build()
    b = _build()
    assert a["signature"] == b["signature"]
    payload = canonical_manifest_payload(
        kind="qq-music",
        instance_id="inst-1",
        tools=TOOLS,
        protocol_version="2024-11-05",
    )
    assert payload == canonical_manifest_payload(
        kind="qq-music",
        instance_id="inst-1",
        tools=TOOLS,
        protocol_version="2024-11-05",
    )


def test_tampered_tools_fail_verification() -> None:
    manifest = _build()
    manifest["tools"] = [{"name": "evil_tool"}]
    assert verify_manifest_signature(manifest, "tok") is False


def test_tampered_kind_fails_verification() -> None:
    manifest = _build()
    manifest["kind"] = "fliggy"
    assert verify_manifest_signature(manifest, "tok") is False


def test_wrong_key_fails_verification() -> None:
    assert verify_manifest_signature(_build(key="other"), "tok") is False
    assert verify_manifest_signature(_build(), "other") is False


def test_missing_fields_fail_verification() -> None:
    manifest = _build()
    del manifest["signature"]
    assert verify_manifest_signature(manifest, "tok") is False
    assert verify_manifest_signature({}, "tok") is False


def test_sign_manifest_hex() -> None:
    assert sign_manifest(b"payload", "tok") == sign_manifest(b"payload", "tok")
    assert sign_manifest(b"payload", "tok") != sign_manifest(b"payload", "other")
