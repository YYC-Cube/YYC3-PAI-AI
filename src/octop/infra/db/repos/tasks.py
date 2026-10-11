"""Task rows — A2A-style stateful task lifecycle (dispatch → execute → feedback)."""

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

    @classmethod
    def from_row(cls, r: DbRow) -> TaskRow:
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
    ) -> TaskRow:
        ts = now_ts()
        with self._db.transaction() as conn:
            conn.execute(
                "INSERT INTO tasks("
                "task_id, user_id, agent_id, title, instruction, status, created_at, updated_at"
                ") VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?)",
                (
                    task_id,
                    user_id,
                    (agent_id or "").strip() or None,
                    title,
                    instruction,
                    ts,
                    ts,
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
