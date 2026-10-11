"""tests/unit/a2a/test_cards.py"""

from __future__ import annotations

from octop.infra.a2a.cards import (
    PROTOCOL_VERSION,
    agent_card,
    card_ref,
    parse_skill_package_ids,
    platform_card,
)
from octop.infra.db.repos.agents import AgentRow
from octop.infra.db.repos.skill_packages import SkillPackageRow


def _agent_row(**overrides: object) -> AgentRow:
    base: dict[str, object] = {
        "id": 1,
        "agent_id": "agent-ulid-1",
        "user_id": 1,
        "name": "main",
        "description": None,
        "persona_mbti": None,
        "default_model": None,
        "system_prompt": None,
        "enabled": 1,
        "config_json": None,
        "last_state": None,
        "last_error": None,
        "created_at": 0,
        "updated_at": 0,
    }
    base.update(overrides)
    return AgentRow(**base)  # type: ignore[arg-type]


def _skill_package(package_id: str, name: str) -> SkillPackageRow:
    return SkillPackageRow(
        id=package_id,
        pk=1,
        name=name,
        description="demo package",
        created_by="tester",
        skill_count=3,
        icon_name="",
        icon_url="",
        copy_policy="copy",
        created_at="",
        updated_at="",
    )


def test_platform_card_shape() -> None:
    card = platform_card(base_url="http://spark.local:8080/", version="1.0.2b6")
    assert card["protocolVersion"] == PROTOCOL_VERSION
    assert card["name"] == "YYC3-Pai"
    assert card["url"] == "http://spark.local:8080/api/a2a"
    assert card["version"] == "1.0.2b6"
    assert card["authentication"]["schemes"] == ["Bearer"]
    assert card["capabilities"]["streaming"] is True
    assert card["capabilities"]["pushNotifications"] is False
    assert card["skills"] == []


def test_agent_card_uses_row_identity() -> None:
    row = _agent_row(
        name="天枢",
        description="元启·天枢总指挥",
        skill_package_ids='["pkg-a", "pkg-b"]',
    )
    skills = [_skill_package("pkg-a", "research"), _skill_package("pkg-b", "coding")]
    card = agent_card(row=row, skills=skills, base_url="http://h/", version="1.0.2b6")
    assert card["name"] == "天枢"
    assert card["description"] == "元启·天枢总指挥"
    assert card["url"] == "http://h/api/a2a/agents/agent-ulid-1"
    assert [s["id"] for s in card["skills"]] == [
        "skill-package:pkg-a",
        "skill-package:pkg-b",
    ]
    assert card["skills"][0]["name"] == "research"


def test_agent_card_description_falls_back() -> None:
    row = _agent_row(name="main")
    card = agent_card(row=row, skills=[], base_url="http://h", version="v")
    assert card["description"] == "YYC3-Pai agent agent-ulid-1"


def test_agent_card_ignores_missing_skill_package() -> None:
    row = _agent_row(skill_package_ids='["gone"]')
    card = agent_card(row=row, skills=[], base_url="http://h", version="v")
    assert card["skills"] == []


def test_card_ref_points_at_card_endpoint() -> None:
    row = _agent_row(name="main")
    ref = card_ref(row=row, base_url="http://h/")
    assert ref == {
        "agentId": "agent-ulid-1",
        "name": "main",
        "cardUrl": "http://h/api/a2a/agents/agent-ulid-1/card",
    }


def test_parse_skill_package_ids() -> None:
    assert parse_skill_package_ids(None) == []
    assert parse_skill_package_ids("") == []
    assert parse_skill_package_ids("not-json") == []
    assert parse_skill_package_ids('{"a": 1}') == []
    assert parse_skill_package_ids('["a", 7, null, "b"]') == ["a", "7", "b"]
