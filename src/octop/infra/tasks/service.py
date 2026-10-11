"""TaskService — family task loop over TaskRepo.

v22 closes the family dispatch loop on top of the A2A state machine:

  · dispatch: ``create`` accepts ``assignee_user_id`` (another household
    member) and ``due_at``. Only admins (家长) may dispatch to someone else;
    members create personal tasks (assignee = themselves / NULL).
  · visibility: ``get`` / ``list_for_user`` see tasks the user created OR is
    assigned to (``role`` picks the bucket).
  · actor transitions: assignees accept/continue/question/complete; either
    side can cancel (撤回/拒绝). See ``lifecycle.assert_actor_transition``.
"""

from __future__ import annotations

from octop.infra.db.repos.tasks import TaskRepo, TaskRow
from octop.infra.db.repos.users import UserRepo
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.tasks import lifecycle
from octop.infra.utils.ulid import new_ulid


class TaskService:
    def __init__(self, repo: TaskRepo, *, user_repo: UserRepo | None = None) -> None:
        self._repo = repo
        self._user_repo = user_repo

    def create(
        self,
        *,
        user_id: int,
        title: str,
        instruction: str | None = None,
        agent_id: str | None = None,
        assignee_user_id: int | None = None,
        due_at: int | None = None,
        actor_is_admin: bool = False,
    ) -> TaskRow:
        if assignee_user_id is not None and assignee_user_id != user_id:
            if not actor_is_admin:
                raise OctopError(
                    ErrorCode.FORBIDDEN,
                    "only admins may dispatch tasks to other members",
                )
            if self._user_repo is None or self._user_repo.get(assignee_user_id) is None:
                raise OctopError(ErrorCode.TASK_ASSIGNEE_NOT_FOUND, "assignee not found")
        return self._repo.create(
            task_id=new_ulid(),
            user_id=user_id,
            title=title.strip(),
            instruction=(instruction or "").strip() or None,
            agent_id=agent_id,
            assignee_user_id=assignee_user_id,
            due_at=due_at,
        )

    def get(self, *, task_id: str, user_id: int) -> TaskRow:
        row = self._repo.get(task_id)
        if row is None or not _is_visible(row, user_id):
            raise OctopError(ErrorCode.TASK_NOT_FOUND, "task not found")
        return row

    def list_for_user(
        self,
        *,
        user_id: int,
        status: str | None = None,
        role: str = "all",
        limit: int = 100,
    ) -> list[TaskRow]:
        if status and not lifecycle.is_valid_state(status):
            raise OctopError(ErrorCode.TASK_INVALID_STATUS, f"unknown task state: {status!r}")
        if role not in ("created", "assigned", "all"):
            raise OctopError(ErrorCode.TASK_INVALID_STATUS, f"unknown task role: {role!r}")
        return self._repo.list_visible_for_user(user_id, status=status, role=role, limit=limit)

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
        # Personal tasks (assignee NULL) are worked by the creator themselves.
        assignee_id = row.assignee_user_id if row.assignee_user_id is not None else row.user_id
        lifecycle.assert_actor_transition(
            actor_is_creator=row.user_id == user_id,
            actor_is_assignee=assignee_id == user_id,
            from_state=row.status,
            to_state=to_state,
        )
        updated = self._repo.update(
            task_id,
            status=to_state,
            result=(result or "").strip() or None,
            error=(error or "").strip() or None,
        )
        assert updated is not None  # noqa: S101
        return updated


def _is_visible(row: TaskRow, user_id: int) -> bool:
    return row.user_id == user_id or row.assignee_user_id == user_id
