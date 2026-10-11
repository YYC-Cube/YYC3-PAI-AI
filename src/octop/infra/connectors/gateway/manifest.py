"""Signed tool manifest publishing for gateway connector kinds.

Pure logic only: canonical serialization, HMAC-SHA256 signing and
verification. The signing key is the per-instance internal token, so any
holder of the token can verify that a manifest genuinely came from this
gateway instance and was not tampered with in transit.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

MANIFEST_ALGORITHM = "hmac-sha256"
MANIFEST_SCHEMA_VERSION = 1


def canonical_manifest_payload(
    *,
    kind: str,
    instance_id: str,
    tools: list[dict[str, Any]],
    protocol_version: str,
) -> bytes:
    """Deterministic serialization of the signed portion of the manifest."""
    doc = {
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "kind": kind,
        "instanceId": instance_id,
        "protocolVersion": protocol_version,
        "tools": tools,
    }
    return json.dumps(doc, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def sign_manifest(payload: bytes, key: str) -> str:
    return hmac.new(key.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def build_signed_manifest(
    *,
    kind: str,
    instance_id: str,
    tools: list[dict[str, Any]],
    protocol_version: str,
    key: str,
    signed_at: int,
) -> dict[str, Any]:
    """Assemble a manifest dict with an HMAC-SHA256 signature over its body."""
    payload = canonical_manifest_payload(
        kind=kind,
        instance_id=instance_id,
        tools=tools,
        protocol_version=protocol_version,
    )
    return {
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "kind": kind,
        "instanceId": instance_id,
        "protocolVersion": protocol_version,
        "tools": tools,
        "signedAt": signed_at,
        "signatureAlgorithm": MANIFEST_ALGORITHM,
        "signature": sign_manifest(payload, key),
    }


def verify_manifest_signature(manifest: dict[str, Any], key: str) -> bool:
    """Verify a manifest dict against its embedded signature."""
    try:
        payload = canonical_manifest_payload(
            kind=str(manifest["kind"]),
            instance_id=str(manifest["instanceId"]),
            tools=list(manifest["tools"]),
            protocol_version=str(manifest["protocolVersion"]),
        )
        expected = str(manifest["signature"])
    except (KeyError, TypeError, ValueError):
        return False
    return hmac.compare_digest(sign_manifest(payload, key), expected)
