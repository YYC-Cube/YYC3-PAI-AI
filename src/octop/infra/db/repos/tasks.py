"""Task rows — A2A-style stateful task lifecycle (dispatch → execute → feedback).

v22 adds the family-loop fields: ``assignee_user_id`` (dispatch target,
NULL = personal task) and ``due_at`` (follow-up deadline, epoch seconds).
"""

from __future__ import annotations

from dataclasses import dataclass

from octop.infra.db.pool import DatabasePool
from octop.infra.db.repos._base import DbRow, map_rows, now_ts

__all__ = ["TaskRepo", "TaskRow"]


@dataclass(frozen=True)
class TaskRow:
    id: int
    task_id: str
    user_id: int
    agent_id: str | None
    title: str
    instruction: str | None
    status: str
    result: str | None
    error: str | None
    created_at: int
    updated_at: int
    assignee_user_id: int | None = None
    due_at: int | None = None

    @classmethod
    def from_row(cls, r: DbRow) -> TaskRow:
        assignee = r["assignee_user_id"]
        due = r["due_at"]
        return cls(
            id=int(r["id"]),
            task_id=str(r["task_id"]),
            user_id=int(r["user_id"]),
            agent_id=(str(r["agent_id"]).strip() if r["agent_id"] else None),
            title=str(r["title"]),
            instruction=r["instruction"],
            status=str(r["status"]),
            result=r["result"],
            error=r["error"],
            created_at=int(r["created_at"]),
            updated_at=int(r["updated_at"]),
            assignee_user_id=int(assignee) if assignee is not None else None,
            due_at=int(due) if due is not None else None,
        )


class TaskRepo:
    def __init__(self, db: DatabasePool) -> None:
        self._db = db

    def create(
        self,
        *,
        task_id: str,
        user_id: int,
        title: str,
        instruction: str | None = None,
        agent_id: str | None = None,
        assignee_user_id: int | None = None,
        due_at: int | None = None,
    ) -> TaskRow:
        ts = now_ts()
        with self._db.transaction() as conn:
            conn.execute(
                "INSERT INTO tasks("
                "task_id, user_id, agent_id, title, instruction, status, "
                "created_at, updated_at, assignee_user_id, due_at"
                ") VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?)",
                (
                    task_id,
                    user_id,
                    (agent_id or "").strip() or None,
                    title,
                    instruction,
                    ts,
                    ts,
                    assignee_user_id,
                    due_at,
                ),
            )
        row = self.get(task_id)
        assert row is not None  # noqa: S101
        return row

    def get(self, task_id: str) -> TaskRow | None:
        with self._db.connect() as conn:
            r = conn.execute(
                "SELECT * FROM tasks WHERE task_id = ?",
                (task_id,),
            ).fetchone()
        return TaskRow.from_row(r) if r else None

    def list_for_user(
        self,
        user_id: int,
        *,
        status: str | None = None,
        limit: int = 100,
    ) -> list[TaskRow]:
        """Tasks created by *user_id* (back-compat: owned view)."""
        sql = "SELECT * FROM tasks WHERE user_id = ?"
        params: list[object] = [user_id]
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY updated_at DESC LIMIT ?"
        params.append(limit)
        with self._db.connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return map_rows(rows, TaskRow)

    def list_visible_for_user(
        self,
        user_id: int,
        *,
        status: str | None = None,
        role: str = "all",
        limit: int = 100,
    ) -> list[TaskRow]:
        """Tasks visible to *user_id*: created by, assigned to, or both.

        ``role`` is one of ``created`` / ``assigned`` / ``all``.
        """
        if role == "created":
            sql = "SELECT * FROM tasks WHERE user_id = ?"
            params: list[object] = [user_id]
        elif role == "assigned":
            sql = "SELECT * FROM tasks WHERE assignee_user_id = ?"
            params = [user_id]
        else:
            sql = "SELECT * FROM tasks WHERE (user_id = ? OR assignee_user_id = ?)"
            params = [user_id, user_id]
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY updated_at DESC LIMIT ?"
        params.append(limit)
        with self._db.connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return map_rows(rows, TaskRow)

    def update(
        self,
        task_id: str,
        *,
        status: str,
        result: str | None = None,
        error: str | None = None,
    ) -> TaskRow | None:
        with self._db.transaction() as conn:
            conn.execute(
                "UPDATE tasks SET status = ?, result = ?, error = ?, updated_at = ?"
                " WHERE task_id = ?",
                (status, result, error, now_ts(), task_id),
            )
        return self.get(task_id)
