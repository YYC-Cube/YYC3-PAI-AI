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


# --- family loop: dispatch, visibility, actor transitions ---------------------


@pytest.fixture
def family(db: SqlitePool) -> tuple[TaskService, int, int, int]:
    users = UserRepo(db)
    admin = users.create(username="parent", password_hash="h", role="admin")
    member = users.create(username="kid", password_hash="h", role="user")
    other = users.create(username="guest", password_hash="h", role="user")
    service = TaskService(repo=TaskRepo(db), user_repo=users)
    return service, admin, member, other


def test_admin_dispatch_to_member(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, member, _ = family
    row = service.create(
        user_id=admin,
        title="倒垃圾",
        assignee_user_id=member,
        due_at=1_800_000_000,
        actor_is_admin=True,
    )
    assert row.assignee_user_id == member
    assert row.due_at == 1_800_000_000


def test_non_admin_dispatch_forbidden(family: tuple[TaskService, int, int, int]) -> None:
    service, _, member, other = family
    with pytest.raises(OctopError) as excinfo:
        service.create(user_id=member, title="帮我", assignee_user_id=other)
    assert excinfo.value.code == ErrorCode.FORBIDDEN


def test_member_assign_to_self_allowed(family: tuple[TaskService, int, int, int]) -> None:
    service, _, member, _ = family
    row = service.create(user_id=member, title="个人任务", assignee_user_id=member)
    assert row.assignee_user_id == member


def test_dispatch_unknown_assignee(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, _, _ = family
    with pytest.raises(OctopError) as excinfo:
        service.create(user_id=admin, title="x", assignee_user_id=999_999, actor_is_admin=True)
    assert excinfo.value.code == ErrorCode.TASK_ASSIGNEE_NOT_FOUND


def test_dispatch_needs_user_repo(db: SqlitePool) -> None:
    users = UserRepo(db)
    member = users.create(username="solo-member", password_hash="h", role="user")
    admin = users.create(username="solo-admin", password_hash="h", role="admin")
    service = TaskService(repo=TaskRepo(db))
    with pytest.raises(OctopError) as excinfo:
        service.create(user_id=admin, title="x", assignee_user_id=member, actor_is_admin=True)
    assert excinfo.value.code == ErrorCode.TASK_ASSIGNEE_NOT_FOUND


def test_get_visibility(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, member, other = family
    row = service.create(user_id=admin, title="洗碗", assignee_user_id=member, actor_is_admin=True)
    assert service.get(task_id=row.task_id, user_id=admin).title == "洗碗"
    assert service.get(task_id=row.task_id, user_id=member).title == "洗碗"
    with pytest.raises(OctopError) as excinfo:
        service.get(task_id=row.task_id, user_id=other)
    assert excinfo.value.code == ErrorCode.TASK_NOT_FOUND


def test_assignee_workflow_and_creator_limits(
    family: tuple[TaskService, int, int, int],
) -> None:
    service, admin, member, _ = family
    row = service.create(
        user_id=admin, title="写作业", assignee_user_id=member, actor_is_admin=True
    )
    # assignee accepts
    row = service.transition(task_id=row.task_id, user_id=member, to_state="working")
    assert row.status == "working"
    # assignee asks a question, then continues
    service.transition(task_id=row.task_id, user_id=member, to_state="input_required")
    service.transition(task_id=row.task_id, user_id=member, to_state="working")
    # creator cannot complete on the member's behalf
    with pytest.raises(OctopError) as excinfo:
        service.transition(task_id=row.task_id, user_id=admin, to_state="completed")
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION
    # assignee completes
    done = service.transition(
        task_id=row.task_id, user_id=member, to_state="completed", result="写完了"
    )
    assert done.status == "completed"
    assert done.result == "写完了"


def test_creator_can_recall_dispatch(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, member, _ = family
    row = service.create(
        user_id=admin, title="临时任务", assignee_user_id=member, actor_is_admin=True
    )
    canceled = service.transition(task_id=row.task_id, user_id=admin, to_state="canceled")
    assert canceled.status == "canceled"


def test_assignee_can_reject_dispatch(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, member, _ = family
    row = service.create(
        user_id=admin, title="不想做", assignee_user_id=member, actor_is_admin=True
    )
    canceled = service.transition(task_id=row.task_id, user_id=member, to_state="canceled")
    assert canceled.status == "canceled"


def test_unrelated_member_cannot_transition(
    family: tuple[TaskService, int, int, int],
) -> None:
    service, admin, member, other = family
    row = service.create(user_id=admin, title="家务", assignee_user_id=member, actor_is_admin=True)
    with pytest.raises(OctopError) as excinfo:
        service.transition(task_id=row.task_id, user_id=other, to_state="working")
    assert excinfo.value.code == ErrorCode.TASK_NOT_FOUND  # invisible → 404 first


def test_list_roles_split_buckets(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, member, _ = family
    service.create(user_id=admin, title="a", assignee_user_id=member, actor_is_admin=True)
    service.create(user_id=admin, title="b", assignee_user_id=member, actor_is_admin=True)
    service.create(user_id=member, title="c")
    assigned = service.list_for_user(user_id=member, role="assigned")
    assert [r.title for r in assigned] == ["b", "a"]
    created = service.list_for_user(user_id=member, role="created")
    assert [r.title for r in created] == ["c"]
    both = service.list_for_user(user_id=member)
    assert {r.title for r in both} == {"a", "b", "c"}
    with pytest.raises(OctopError) as excinfo:
        service.list_for_user(user_id=member, role="nope")
    assert excinfo.value.code == ErrorCode.TASK_INVALID_STATUS


def test_repo_back_compat_created_only(family: tuple[TaskService, int, int, int]) -> None:
    service, admin, member, _ = family
    service.create(user_id=admin, title="a", assignee_user_id=member, actor_is_admin=True)
    service.create(user_id=member, title="c")
    db_repo = TaskRepo(service._repo._db)  # noqa: SLF001
    rows = db_repo.list_for_user(member)
    assert [r.title for r in rows] == ["c"]
