"""A2A (Agent2Agent) v1.0 agent card construction.

Pure builders that render A2A discovery documents from domain rows — no
I/O. A card advertises identity, endpoint URL, capabilities, the
authentication scheme, and the agent's skill manifest. Cards deliberately
never contain workspace paths, MCP server configurations, connector
secrets, or credential material: a card is a public discovery document.
"""

from __future__ import annotations

import json
from collections.abc import Sequence
from typing import Any

from octop.infra.db.repos.agents import AgentRow
from octop.infra.db.repos.skill_packages import SkillPackageRow

PROTOCOL_VERSION = "1.0"

_PROVIDER = {
    "organization": "YYC-Cube",
    "url": "https://github.com/YYC-Cube/YYC3-PAI-AI",
}

_CAPABILITIES = {
    "streaming": True,
    "pushNotifications": False,
    "stateTransitionHistory": False,
}

_AUTHENTICATION = {
    "schemes": ["Bearer"],
    "credentials": None,
}

_INPUT_MODES = ["text"]
_OUTPUT_MODES = ["text"]


def platform_card(*, base_url: str, version: str) -> dict[str, Any]:
    """Card for the platform itself, served at ``/.well-known/agent.json``.

    The per-agent card index lives behind the platform's normal JWT auth
    (see ``/api/a2a/agents``); this public card only points A2A clients at
    the authenticated surface and declares the Bearer scheme they must use.
    """

    root = base_url.rstrip("/")
    return {
        "protocolVersion": PROTOCOL_VERSION,
        "name": "YYC3-Pai",
        "description": (
            "YYC3-Pai self-hosted multi-user multi-agent platform. "
            "Per-agent cards are listed by the authenticated index endpoint."
        ),
        "url": f"{root}/api/a2a",
        "provider": dict(_PROVIDER),
        "version": version,
        "documentationUrl": f"{root}/api/docs",
        "capabilities": dict(_CAPABILITIES),
        "authentication": dict(_AUTHENTICATION),
        "defaultInputModes": list(_INPUT_MODES),
        "defaultOutputModes": list(_OUTPUT_MODES),
        "skills": [],
    }


def agent_card(
    *,
    row: AgentRow,
    skills: Sequence[SkillPackageRow],
    base_url: str,
    version: str,
) -> dict[str, Any]:
    """Card for a single agent, advertised at its A2A task endpoint."""

    root = base_url.rstrip("/")
    return {
        "protocolVersion": PROTOCOL_VERSION,
        "name": row.name,
        "description": row.description or f"YYC3-Pai agent {row.agent_id}",
        "url": f"{root}/api/a2a/agents/{row.agent_id}",
        "provider": dict(_PROVIDER),
        "version": version,
        "documentationUrl": f"{root}/api/docs",
        "capabilities": dict(_CAPABILITIES),
        "authentication": dict(_AUTHENTICATION),
        "defaultInputModes": list(_INPUT_MODES),
        "defaultOutputModes": list(_OUTPUT_MODES),
        "skills": [
            {
                "id": f"skill-package:{pkg.id}",
                "name": pkg.name,
                "description": pkg.description or "",
                "tags": [],
                "examples": [],
            }
            for pkg in skills
        ],
    }


def card_ref(*, row: AgentRow, base_url: str) -> dict[str, Any]:
    """Index entry referencing an agent's full card."""

    root = base_url.rstrip("/")
    return {
        "agentId": row.agent_id,
        "name": row.name,
        "cardUrl": f"{root}/api/a2a/agents/{row.agent_id}/card",
    }


def parse_skill_package_ids(raw: str | None) -> list[str]:
    """Best-effort decode of ``AgentRow.skill_package_ids`` (JSON list)."""

    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (TypeError, ValueError):
        return []
    if not isinstance(data, list):
        return []
    return [str(item) for item in data if isinstance(item, (str, int))]
