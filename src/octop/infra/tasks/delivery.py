"""Task loop delivery — best-effort IM notifications for the family dispatch loop.

When a task is dispatched to another member (or its state changes), the other
party gets a short IM message on their most recent active IM session, matching
the cron delivery model (``Gateway.push_text_from_session``). Delivery is
strictly best-effort: no session, unknown agent, or channel hiccup logs a
warning and never fails the API call.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from octop.i18n import tr
from octop.infra.db.repos.tasks import TaskRow
from octop.infra.utils.locale import resolve_user_locale

if TYPE_CHECKING:
    from octop.infra.db.repos.sessions import SessionRepo
    from octop.infra.db.repos.users import UserRepo

logger = logging.getLogger(__name__)

_VIRTUAL_CHANNELS = ("dashboard", "cli")

# Event → i18n key under the ``tasks`` namespace.
_EVENT_KEYS = {
    "dispatched": "tasks.notify_dispatched",
    "accepted": "tasks.notify_accepted",
    "completed": "tasks.notify_completed",
    "canceled": "tasks.notify_canceled",
    "input_required": "tasks.notify_input_required",
}


class TaskDelivery:
    def __init__(
        self,
        *,
        session_repo: SessionRepo,
        user_repo: UserRepo | None = None,
        gateway: Any | None = None,
    ) -> None:
        self._session_repo = session_repo
        self._user_repo = user_repo
        self._gateway = gateway

    async def notify(
        self,
        *,
        task: TaskRow,
        event: str,
        actor_user_id: int,
        actor_username: str,
    ) -> bool:
        """Push a one-line task notification to the party that did NOT act."""
        if self._gateway is None or event not in _EVENT_KEYS:
            return False
        target_user_id = self._counterpart(task, actor_user_id)
        if target_user_id is None:
            return False
        locale = resolve_user_locale(user_repo=self._user_repo, user_id=target_user_id)
        text = tr(_EVENT_KEYS[event], locale, title=task.title, actor=actor_username)
        session = self._pick_session(target_user_id, task.agent_id)
        if session is None:
            logger.info("task %s: no IM session for user %s", task.task_id, target_user_id)
            return False
        try:
            await self._gateway.push_text_from_session(session.agent_id, session.session_key, text)
        except Exception:
            logger.warning(
                "task %s: IM delivery to user %s failed",
                task.task_id,
                target_user_id,
                exc_info=True,
            )
            return False
        return True

    def _counterpart(self, task: TaskRow, actor_user_id: int) -> int | None:
        """The party that should hear about the change (not the actor)."""
        if task.assignee_user_id is None or task.assignee_user_id == task.user_id:
            return None  # personal task: no counterpart
        if actor_user_id == task.user_id:
            return task.assignee_user_id
        return task.user_id

    def _pick_session(self, user_id: int, agent_id: str | None) -> Any | None:
        rows = self._session_repo.list_recent_for_user(
            user_id,
            agent_id=agent_id,
            exclude_channel_types=_VIRTUAL_CHANNELS,
            limit=1,
        )
        if rows:
            return rows[0]
        # Fall back to any agent the member has an IM session on.
        return next(
            iter(
                self._session_repo.list_recent_for_user(
                    user_id,
                    exclude_channel_types=_VIRTUAL_CHANNELS,
                    limit=1,
                )
            ),
            None,
        )
