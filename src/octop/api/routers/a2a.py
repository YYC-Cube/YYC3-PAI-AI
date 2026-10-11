"""A2A (Agent2Agent) v1.0 discovery endpoints.

Serves the platform's well-known agent card plus an authenticated,
user-scoped card index and per-agent capability manifests. Task ingestion
(``message/send`` JSON-RPC) is intentionally not part of this surface yet —
cards come first so remote A2A clients can discover what this instance
offers before the conversation endpoints land.

Field names intentionally follow the A2A wire format (camelCase) rather
than the usual snake_case convention: these models ARE the protocol schema.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from octop.api.common.agent import require_agent_row
from octop.api.deps import current_user, get_server
from octop.infra.a2a import cards
from octop.infra.server import OctopServer

router = APIRouter()
well_known_router = APIRouter()


class A2ASkill(BaseModel):
    id: str
    name: str
    description: str = ""
    tags: list[str] = Field(default_factory=list)
    examples: list[str] = Field(default_factory=list)


class A2AProvider(BaseModel):
    organization: str
    url: str | None = None


class A2ACapabilities(BaseModel):
    streaming: bool
    pushNotifications: bool
    stateTransitionHistory: bool


class A2AAuthentication(BaseModel):
    schemes: list[str]
    credentials: str | None = None


class A2ACard(BaseModel):
    protocolVersion: str
    name: str
    description: str
    url: str
    provider: A2AProvider
    version: str
    documentationUrl: str | None = None
    capabilities: A2ACapabilities
    authentication: A2AAuthentication
    defaultInputModes: list[str]
    defaultOutputModes: list[str]
    skills: list[A2ASkill] = Field(default_factory=list)


class A2ACardRef(BaseModel):
    agentId: str
    name: str
    cardUrl: str


class A2ACardIndex(BaseModel):
    protocolVersion: str
    agents: list[A2ACardRef] = Field(default_factory=list)


def _base_url(request: Request) -> str:
    return str(request.base_url)


def _platform_version() -> str:
    from octop import __version__  # noqa: PLC0415

    return __version__


@well_known_router.get(
    "/.well-known/agent.json",
    response_model=A2ACard,
    summary="A2A well-known agent card (public)",
    description=(
        "Public A2A v1.0 discovery document for this YYC3-Pai instance. "
        "Contains no instance data beyond endpoint URLs; per-agent cards "
        "require Bearer authentication via the index endpoint."
    ),
)
async def well_known_agent_card(request: Request) -> dict[str, Any]:
    return cards.platform_card(base_url=_base_url(request), version=_platform_version())


@router.get(
    "/a2a/agents",
    response_model=A2ACardIndex,
    summary="List A2A cards of the current user's agents",
    description=(
        "Authenticated, user-scoped A2A card index. Each entry references "
        "the full per-agent card, which advertises the agent's skill manifest."
    ),
)
async def list_agent_cards(
    request: Request,
    server: OctopServer = Depends(get_server),
    _user: Any = Depends(current_user),
) -> dict[str, Any]:
    assert server.app_runtime is not None
    rows = server.app_runtime.agent_registry.list_agents(_user.id)
    return {
        "protocolVersion": cards.PROTOCOL_VERSION,
        "agents": [cards.card_ref(row=row, base_url=_base_url(request)) for row in rows],
    }


@router.get(
    "/a2a/agents/{agent_id}/card",
    response_model=A2ACard,
    summary="A2A card for a single agent",
    description=(
        "Full A2A v1.0 card for one agent: identity, task endpoint, "
        "capabilities, Bearer authentication scheme, and the skill manifest "
        "derived from the agent's enabled skill packages."
    ),
)
async def get_agent_card(
    agent_id: str,
    request: Request,
    server: OctopServer = Depends(get_server),
    user: Any = Depends(current_user),
) -> dict[str, Any]:
    row = require_agent_row(agent_id, user=user, as_user=None, server=server)
    assert server.services is not None
    skill_rows = []
    for package_id in cards.parse_skill_package_ids(row.skill_package_ids):
        pkg = server.services.skill_package_repo.get(package_id)
        if pkg is not None:
            skill_rows.append(pkg)
    return cards.agent_card(
        row=row,
        skills=skill_rows,
        base_url=_base_url(request),
        version=_platform_version(),
    )
