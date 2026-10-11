"""Unit tests for TaskService + TaskRepo (SQLite)."""

from __future__ import annotations

from pathlib import Path

import pytest

from octop.infra.db.migrate import run_migrations
from octop.infra.db.pool import SqlitePool
from octop.infra.db.repos.tasks import TaskRepo
from octop.infra.db.repos.users import UserRepo
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.tasks.service import TaskService


@pytest.fixture
def db(tmp_path: Path) -> SqlitePool:
    pool = SqlitePool(tmp_path / "x.db")
    run_migrations(pool)
    return pool


@pytest.fixture
def user_id(db: SqlitePool) -> int:
    return UserRepo(db).create(username="alice", password_hash="h", role="admin")


@pytest.fixture
def service(db: SqlitePool) -> TaskService:
    return TaskService(repo=TaskRepo(db))


def test_create_defaults_to_submitted(service: TaskService, user_id: int) -> None:
    row = service.create(user_id=user_id, title="买牛奶", instruction="顺路买 2L 牛奶")
    assert row.status == "submitted"
    assert row.task_id
    assert row.title == "买牛奶"
    assert row.instruction == "顺路买 2L 牛奶"
    assert row.agent_id is None
    assert row.created_at > 0 and row.updated_at >= row.created_at


def test_get_enforces_ownership(service: TaskService, user_id: int, db: SqlitePool) -> None:
    row = service.create(user_id=user_id, title="t")
    other = UserRepo(db).create(username="bob", password_hash="h", role="user")
    with pytest.raises(OctopError) as excinfo:
        service.get(task_id=row.task_id, user_id=other)
    assert excinfo.value.code == ErrorCode.TASK_NOT_FOUND
    assert service.get(task_id=row.task_id, user_id=user_id).task_id == row.task_id


def test_transition_persists_result(service: TaskService, user_id: int) -> None:
    row = service.create(user_id=user_id, title="t", agent_id="agent-1")
    working = service.transition(task_id=row.task_id, user_id=user_id, to_state="working")
    assert working.status == "working"
    done = service.transition(
        task_id=row.task_id,
        user_id=user_id,
        to_state="completed",
        result="done-deal",
    )
    assert done.status == "completed"
    assert done.result == "done-deal"
    assert service.get(task_id=row.task_id, user_id=user_id).result == "done-deal"


def test_invalid_transition_rejected(service: TaskService, user_id: int) -> None:
    row = service.create(user_id=user_id, title="t")
    with pytest.raises(OctopError) as excinfo:
        service.transition(task_id=row.task_id, user_id=user_id, to_state="completed")
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION
    # rejected transition must not write
    assert service.get(task_id=row.task_id, user_id=user_id).status == "submitted"


def test_unknown_status_rejected(service: TaskService, user_id: int) -> None:
    service.create(user_id=user_id, title="t")
    with pytest.raises(OctopError) as excinfo:
        service.list_for_user(user_id=user_id, status="nope")
    assert excinfo.value.code == ErrorCode.TASK_INVALID_STATUS


def test_list_filters_and_orders(service: TaskService, user_id: int) -> None:
    import time

    a = service.create(user_id=user_id, title="a")
    b = service.create(user_id=user_id, title="b")
    # timestamps are second-granularity; ensure a's activity is strictly newer
    time.sleep(1.1)
    service.transition(task_id=a.task_id, user_id=user_id, to_state="working")
    service.transition(task_id=a.task_id, user_id=user_id, to_state="completed")
    rows = service.list_for_user(user_id=user_id)
    assert [r.task_id for r in rows] == [a.task_id, b.task_id]
    active = service.list_for_user(user_id=user_id, status="submitted")
    assert [r.task_id for r in active] == [b.task_id]
    done = service.list_for_user(user_id=user_id, status="completed", limit=10)
    assert [r.task_id for r in done] == [a.task_id]
