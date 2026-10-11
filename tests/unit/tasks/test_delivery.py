"""Unit tests for TaskDelivery — best-effort IM task notifications."""

from __future__ import annotations

from pathlib import Path

import pytest

from octop.infra.db.migrate import run_migrations
from octop.infra.db.pool import SqlitePool
from octop.infra.db.repos.agents import AgentRepo
from octop.infra.db.repos.sessions import SessionRepo
from octop.infra.db.repos.tasks import TaskRow
from octop.infra.db.repos.threads import ThreadRepo
from octop.infra.db.repos.users import UserRepo
from octop.infra.gateway.threads import ThreadRegistry
from octop.infra.tasks.delivery import TaskDelivery


def _task(**over: object) -> TaskRow:
    base: dict[str, object] = {
        "id": 1,
        "task_id": "t1",
        "user_id": 10,
        "agent_id": "agent-a",
        "title": "买牛奶",
        "instruction": None,
        "status": "working",
        "result": None,
        "error": None,
        "created_at": 1,
        "updated_at": 2,
        "assignee_user_id": 20,
        "due_at": None,
    }
    base.update(over)
    return TaskRow(**base)  # type: ignore[arg-type]


class _FakeSession:
    def __init__(self, agent_id: str = "agent-a", channel_type: str = "feishu") -> None:
        self.agent_id = agent_id
        self.session_key = f"im:{agent_id}:{channel_type}"
        self.channel_type = channel_type


class _FakeSessionRepo:
    def __init__(self, rows: dict[int, list[_FakeSession]]) -> None:
        self._rows = rows
        self.calls: list[tuple[int, str | None, tuple[str, ...]]] = []

    def list_recent_for_user(
        self,
        user_id: int,
        *,
        agent_id: str | None = None,
        exclude_channel_types: tuple[str, ...] = (),
        limit: int = 5,
    ) -> list[_FakeSession]:
        self.calls.append((user_id, agent_id, exclude_channel_types))
        rows = self._rows.get(user_id, [])
        if agent_id:
            rows = [r for r in rows if r.agent_id == agent_id]
        if exclude_channel_types:
            rows = [r for r in rows if r.channel_type not in exclude_channel_types]
        return rows[:limit]


class _FakeGateway:
    def __init__(self, fail: bool = False) -> None:
        self.pushed: list[tuple[str, str, str]] = []
        self._fail = fail

    async def push_text_from_session(self, agent_id: str, session_key: str, text: str) -> None:
        if self._fail:
            raise RuntimeError("channel boom")
        self.pushed.append((agent_id, session_key, text))


async def test_no_gateway_returns_false() -> None:
    delivery = TaskDelivery(session_repo=_FakeSessionRepo({}), gateway=None)
    ok = await delivery.notify(
        task=_task(), event="completed", actor_user_id=10, actor_username="parent"
    )
    assert ok is False


async def test_unknown_event_returns_false() -> None:
    gateway = _FakeGateway()
    delivery = TaskDelivery(session_repo=_FakeSessionRepo({}), gateway=gateway)
    ok = await delivery.notify(
        task=_task(), event="bogus", actor_user_id=10, actor_username="parent"
    )
    assert ok is False
    assert gateway.pushed == []


@pytest.mark.parametrize("assignee", [None, 10])
async def test_personal_task_has_no_counterpart(assignee: int | None) -> None:
    gateway = _FakeGateway()
    delivery = TaskDelivery(session_repo=_FakeSessionRepo({10: [_FakeSession()]}), gateway=gateway)
    ok = await delivery.notify(
        task=_task(assignee_user_id=assignee),
        event="completed",
        actor_user_id=10,
        actor_username="me",
    )
    assert ok is False
    assert gateway.pushed == []


async def test_creator_action_notifies_assignee() -> None:
    gateway = _FakeGateway()
    sessions = _FakeSessionRepo({20: [_FakeSession()]})
    delivery = TaskDelivery(session_repo=sessions, gateway=gateway)
    ok = await delivery.notify(
        task=_task(), event="dispatched", actor_user_id=10, actor_username="parent"
    )
    assert ok is True
    agent_id, session_key, text = gateway.pushed[0]
    assert agent_id == "agent-a"
    assert session_key.startswith("im:")
    assert "买牛奶" in text
    assert "parent" in text
    # delivery only targets IM sessions (dashboard/cli excluded)
    assert sessions.calls[0][2] == ("dashboard", "cli")


async def test_assignee_action_notifies_creator() -> None:
    gateway = _FakeGateway()
    delivery = TaskDelivery(session_repo=_FakeSessionRepo({10: [_FakeSession()]}), gateway=gateway)
    ok = await delivery.notify(
        task=_task(), event="completed", actor_user_id=20, actor_username="kid"
    )
    assert ok is True
    assert "买牛奶" in gateway.pushed[0][2]
    assert "已完成" in gateway.pushed[0][2]


async def test_no_im_session_returns_false() -> None:
    gateway = _FakeGateway()
    delivery = TaskDelivery(
        session_repo=_FakeSessionRepo({20: [_FakeSession(channel_type="dashboard")]}),
        gateway=gateway,
    )
    ok = await delivery.notify(
        task=_task(), event="dispatched", actor_user_id=10, actor_username="parent"
    )
    assert ok is False
    assert gateway.pushed == []


async def test_gateway_failure_is_swallowed() -> None:
    gateway = _FakeGateway(fail=True)
    delivery = TaskDelivery(session_repo=_FakeSessionRepo({20: [_FakeSession()]}), gateway=gateway)
    ok = await delivery.notify(
        task=_task(), event="dispatched", actor_user_id=10, actor_username="parent"
    )
    assert ok is False


async def test_falls_back_to_session_on_other_agent() -> None:
    gateway = _FakeGateway()
    sessions = _FakeSessionRepo({20: [_FakeSession(agent_id="agent-b", channel_type="wechat")]})
    delivery = TaskDelivery(session_repo=sessions, gateway=gateway)
    ok = await delivery.notify(
        task=_task(agent_id="agent-a"),
        event="dispatched",
        actor_user_id=10,
        actor_username="parent",
    )
    assert ok is True
    assert gateway.pushed[0][0] == "agent-b"
    # first scoped query missed, cross-agent fallback found the session
    assert len(sessions.calls) == 2


# --- SessionRepo.list_recent_for_user (real DB) -------------------------------


@pytest.fixture
def db(tmp_path: Path) -> SqlitePool:
    pool = SqlitePool(tmp_path / "x.db")
    run_migrations(pool)
    return pool


def test_list_recent_for_user_filters_virtual_channels(db: SqlitePool) -> None:
    user_id = UserRepo(db).create(username="kid", password_hash="h", role="user")
    AgentRepo(db).create(agent_id="a1", user_id=user_id, name="Agent 1")
    threads = ThreadRepo(db)
    sessions = SessionRepo(db)
    dash_key = ThreadRegistry.dashboard_key(agent_id="a1", user_id=user_id)
    im_key = ThreadRegistry.make_key(
        agent_id="a1", channel_type="feishu", channel_subject_id="ou_1"
    )
    threads.insert(
        thread_id="thr1",
        agent_id="a1",
        user_id=user_id,
        channel_type="feishu",
        session_key=im_key,
    )
    sessions.upsert(
        session_key=dash_key,
        agent_id="a1",
        user_id=user_id,
        channel_type="dashboard",
        chat_type="dm",
        thread_id="thr1",
    )
    sessions.upsert(
        session_key=im_key,
        agent_id="a1",
        user_id=user_id,
        channel_type="feishu",
        chat_type="dm",
        thread_id="thr1",
        channel_id="ch-1",
    )
    all_rows = sessions.list_recent_for_user(user_id)
    assert {r.session_key for r in all_rows} == {dash_key, im_key}
    im_only = sessions.list_recent_for_user(user_id, exclude_channel_types=("dashboard", "cli"))
    assert [r.session_key for r in im_only] == [im_key]
    scoped = sessions.list_recent_for_user(user_id, agent_id="a2")
    assert scoped == []
