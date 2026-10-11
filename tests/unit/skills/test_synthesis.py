"""Trajectory → skill synthesis — pairing, slug, doc rendering, service guards."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from octop.infra.db.migrate import run_migrations
from octop.infra.db.pool import SqlitePool
from octop.infra.db.repos.agents import AgentRepo
from octop.infra.db.repos.threads import ThreadRepo
from octop.infra.db.repos.trajectory_events import TrajectoryEventRepo
from octop.infra.db.repos.users import UserRepo
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.history.trajectory.types import TrajectoryEvent
from octop.infra.skills import synthesis
from octop.infra.skills.synthesis_service import TrajectorySkillSynthesizer


def _event(
    *,
    event_id: str,
    seq: int,
    kind: str = "tool",
    thread_id: str = "T1",
    payload: dict[str, Any] | None = None,
    is_error: bool = False,
) -> TrajectoryEvent:
    return TrajectoryEvent(
        event_id=event_id,
        thread_id=thread_id,
        agent_id="A1",
        seq=seq,
        ts=float(seq),
        kind=kind,  # type: ignore[arg-type]
        turn_id=None,
        request_seq=None,
        is_error=is_error,
        summary="",
        payload=payload or {},
    )


def _call(call_id: str, name: str, args: Any = None) -> dict[str, Any]:
    return {"call_id": call_id, "name": name, "args": args}


def _result(call_id: str, name: str, result: Any = None) -> dict[str, Any]:
    return {"call_id": call_id, "name": name, "result": result}


# --- extract_tool_invocations -------------------------------------------------


def test_pairs_call_and_result_by_call_id_in_order() -> None:
    events = [
        _event(event_id="e1", seq=1, kind="user"),
        _event(event_id="e2", seq=2, payload=_call("c1", "read_file", {"path": "a.py"})),
        _event(event_id="e3", seq=3, payload=_call("c2", "write_file", {"path": "b.py"})),
        _event(event_id="e4", seq=4, payload=_result("c1", "read_file", "contents")),
        _event(event_id="e5", seq=5, payload=_result("c2", "write_file", "ok")),
    ]
    invocations = synthesis.extract_tool_invocations(events)
    assert [inv.name for inv in invocations] == ["read_file", "write_file"]
    assert invocations[0].args == {"path": "a.py"}
    assert invocations[0].result == "contents"
    assert all(inv.ok for inv in invocations)


def test_marks_error_and_unmatched_results() -> None:
    events = [
        _event(event_id="e1", seq=1, payload=_call("c1", "run_shell", {"cmd": "true"})),
        _event(
            event_id="e2",
            seq=2,
            payload=_result("c1", "run_shell", "boom"),
            is_error=True,
        ),
        _event(event_id="e3", seq=3, payload=_call("c2", "read_file", {"path": "x"})),
        _event(event_id="e4", seq=4, payload=_call("c3", "failing", {}), is_error=True),
        _event(event_id="e5", seq=5, payload=_result("c3", "failing", None), is_error=True),
    ]
    invocations = synthesis.extract_tool_invocations(events)
    assert len(invocations) == 3
    assert invocations[0].ok is False  # result flagged is_error
    assert invocations[1].ok is False  # no result observed
    assert invocations[1].result is None
    assert invocations[2].ok is False  # call itself errored


def test_ignores_non_tool_events_and_result_only_payload() -> None:
    events = [
        _event(event_id="e1", seq=1, kind="assistant", payload={"content": "hi"}),
        _event(event_id="e2", seq=2, payload=_result("solo", "orphan_tool", "r")),
    ]
    invocations = synthesis.extract_tool_invocations(events)
    assert len(invocations) == 1
    assert invocations[0].name == "orphan_tool"
    assert invocations[0].args is None


def test_empty_events_yield_no_invocations() -> None:
    assert synthesis.extract_tool_invocations([]) == []


# --- slugify_title -------------------------------------------------------------


def test_slugify_ascii_title() -> None:
    assert synthesis.slugify_title("Backup Database Nightly") == "backup-database-nightly"


def test_slugify_cjk_title_falls_back_to_hash() -> None:
    slug = synthesis.slugify_title("数据备份流程")
    assert slug.startswith("skill-")
    assert len(slug) == len("skill-") + 8
    assert synthesis.slugify_title("数据备份流程") == slug  # stable


# --- build_skill_doc -----------------------------------------------------------


def test_doc_has_frontmatter_and_tool_sequence() -> None:
    invocations = [
        synthesis.ToolInvocation(name="read_file", args={"path": "a.py"}, result="ok", ok=True),
        synthesis.ToolInvocation(name="run_shell", args={"cmd": "x"}, result=None, ok=False),
    ]
    doc = synthesis.build_skill_doc(
        name="my-skill",
        title="My Skill",
        invocations=invocations,
        source_thread_id="T1",
        agent_id="A1",
        generated_at=datetime(2026, 10, 11, tzinfo=UTC),
    )
    assert doc.startswith("---\nname: my-skill\n")
    assert "synthesized_from: T1" in doc
    assert "synthesized_by: A1" in doc
    assert "synthesized_at: 2026-10-11T00:00:00+00:00" in doc
    assert "### 1. `read_file`（✅ 成功）" in doc
    assert "### 2. `run_shell`（❌ 失败）" in doc
    assert "本轨迹包含 1 次失败调用" in doc
    # Front-matter closes before the body heading.
    assert doc.index("---", 4) < doc.index("# My Skill")


def test_doc_notes_all_successful_trajectory() -> None:
    doc = synthesis.build_skill_doc(
        name="s",
        title="S",
        invocations=[
            synthesis.ToolInvocation(name="t", args=None, result="r", ok=True),
        ],
        source_thread_id="T9",
        agent_id="A9",
    )
    assert "工具调用全部成功" in doc


# --- service -------------------------------------------------------------------


def _synthesizer(tmp_path: Path) -> TrajectorySkillSynthesizer:
    db = SqlitePool(tmp_path / "octop.db")
    run_migrations(db)
    user_id = UserRepo(db).create(username="u1", password_hash="h", role="user")
    AgentRepo(db).create(agent_id="A1", user_id=user_id, name="Agent")
    ThreadRepo(db).insert(
        thread_id="T1",
        agent_id="A1",
        user_id=user_id,
        channel_type="dashboard",
        session_key="sk-1",
        last_active=0,
    )
    return TrajectorySkillSynthesizer(
        trajectory_repo=TrajectoryEventRepo(db),
        thread_repo=ThreadRepo(db),
    )


def _seed_tool_pair(repo: TrajectoryEventRepo) -> None:
    repo.append(_event(event_id="e1", seq=1, payload=_call("c1", "read_file", {"path": "a"})))
    repo.append(_event(event_id="e2", seq=2, payload=_result("c1", "read_file", "ok")))


def test_draft_returns_markdown_for_owner(tmp_path: Path) -> None:
    synthesizer = _synthesizer(tmp_path)
    repo = synthesizer._trajectory_repo  # noqa: SLF001
    _seed_tool_pair(repo)
    draft = synthesizer.draft(thread_id="T1", user_id=1, title="Read A File")
    assert draft.name == "read-a-file"
    assert "read_file" in draft.markdown
    assert "T1" in draft.markdown


def test_draft_rejects_non_owner_and_missing_thread(tmp_path: Path) -> None:
    synthesizer = _synthesizer(tmp_path)
    with pytest.raises(OctopError) as exc_info:
        synthesizer.draft(thread_id="T1", user_id=999, title="X")
    assert exc_info.value.code is ErrorCode.NOT_FOUND
    with pytest.raises(OctopError) as exc_info:
        synthesizer.draft(thread_id="no-such", user_id=1, title="X")
    assert exc_info.value.code is ErrorCode.NOT_FOUND


def test_draft_raises_empty_when_no_tool_calls(tmp_path: Path) -> None:
    synthesizer = _synthesizer(tmp_path)
    repo = synthesizer._trajectory_repo  # noqa: SLF001
    repo.append(_event(event_id="e1", seq=1, kind="user", payload={"content": "hi"}))
    with pytest.raises(OctopError) as exc_info:
        synthesizer.draft(thread_id="T1", user_id=1, title="X")
    assert exc_info.value.code is ErrorCode.SKILL_SYNTHESIS_EMPTY
    envelope = exc_info.value.to_envelope(locale="zh")
    assert envelope["error"]["message"]
