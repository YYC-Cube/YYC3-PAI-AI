"""TaskService — user-scoped task lifecycle orchestration over TaskRepo."""

from __future__ import annotations

from octop.infra.db.repos.tasks import TaskRepo, TaskRow
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.tasks import lifecycle
from octop.infra.utils.ulid import new_ulid


class TaskService:
    def __init__(self, repo: TaskRepo) -> None:
        self._repo = repo

    def create(
        self,
        *,
        user_id: int,
        title: str,
        instruction: str | None = None,
        agent_id: str | None = None,
    ) -> TaskRow:
        return self._repo.create(
            task_id=new_ulid(),
            user_id=user_id,
            title=title.strip(),
            instruction=(instruction or "").strip() or None,
            agent_id=agent_id,
        )

    def get(self, *, task_id: str, user_id: int) -> TaskRow:
        row = self._repo.get(task_id)
        if row is None or row.user_id != user_id:
            raise OctopError(ErrorCode.TASK_NOT_FOUND, "task not found")
        return row

    def list_for_user(
        self,
        *,
        user_id: int,
        status: str | None = None,
        limit: int = 100,
    ) -> list[TaskRow]:
        if status and not lifecycle.is_valid_state(status):
            raise OctopError(ErrorCode.TASK_INVALID_STATUS, f"unknown task state: {status!r}")
        return self._repo.list_for_user(user_id, status=status, limit=limit)

    def transition(
        self,
        *,
        task_id: str,
        user_id: int,
        to_state: str,
        result: str | None = None,
        error: str | None = None,
    ) -> TaskRow:
        row = self.get(task_id=task_id, user_id=user_id)
        lifecycle.assert_transition(row.status, to_state)
        updated = self._repo.update(
            task_id,
            status=to_state,
            result=(result or "").strip() or None,
            error=(error or "").strip() or None,
        )
        assert updated is not None  # noqa: S101
        return updated
