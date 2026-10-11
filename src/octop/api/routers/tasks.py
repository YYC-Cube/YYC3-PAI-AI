"""Stateful task lifecycle API (A2A v1.0 TaskState subset).

User-scoped: every task belongs to the creating user. Task execution by
agents is intentionally out of scope here — this surface models the
lifecycle (dispatch → working → input/result) that family-task dispatch
loops and future A2A task endpoints share.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from octop.api.deps import current_user, get_server
from octop.infra.db.repos.tasks import TaskRow
from octop.infra.server import OctopServer
from octop.infra.tasks import TASK_STATES, TaskService

router = APIRouter()


class TaskCreateBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    instruction: str | None = Field(default=None, max_length=20000)
    agent_id: str | None = Field(default=None, max_length=100)


class TaskTransitionBody(BaseModel):
    status: str = Field(min_length=1)
    result: str | None = Field(default=None, max_length=20000)
    error: str | None = Field(default=None, max_length=20000)


class TaskOut(BaseModel):
    task_id: str
    agent_id: str | None
    title: str
    instruction: str | None
    status: str
    result: str | None
    error: str | None
    created_at: int
    updated_at: int


class TaskListOut(BaseModel):
    tasks: list[TaskOut]
    states: list[str] = Field(default_factory=lambda: list(TASK_STATES))


def _service(server: OctopServer) -> TaskService:
    assert server.services is not None
    return TaskService(repo=server.services.repos.task_repo)


def _out(row: TaskRow) -> TaskOut:
    return TaskOut(
        task_id=row.task_id,
        agent_id=row.agent_id,
        title=row.title,
        instruction=row.instruction,
        status=row.status,
        result=row.result,
        error=row.error,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post(
    "/tasks",
    response_model=TaskOut,
    status_code=201,
    summary="Create a task",
    description=(
        "Create a task in the ``submitted`` state. Optionally bind it to an "
        "agent and give it an instruction payload for later execution."
    ),
)
async def create_task(
    body: TaskCreateBody,
    server: OctopServer = Depends(get_server),
    user: Any = Depends(current_user),
) -> TaskOut:
    row = _service(server).create(
        user_id=user.id,
        title=body.title,
        instruction=body.instruction,
        agent_id=body.agent_id,
    )
    return _out(row)


@router.get(
    "/tasks",
    response_model=TaskListOut,
    summary="List my tasks",
    description="List the current user's tasks, newest activity first, optionally filtered by state.",
)
async def list_tasks(
    status: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    server: OctopServer = Depends(get_server),
    user: Any = Depends(current_user),
) -> TaskListOut:
    rows = _service(server).list_for_user(user_id=user.id, status=status, limit=limit)
    return TaskListOut(tasks=[_out(r) for r in rows])


@router.get(
    "/tasks/{task_id}",
    response_model=TaskOut,
    summary="Get a task",
    description="Fetch one of the current user's tasks by its public id.",
)
async def get_task(
    task_id: str,
    server: OctopServer = Depends(get_server),
    user: Any = Depends(current_user),
) -> TaskOut:
    return _out(_service(server).get(task_id=task_id, user_id=user.id))


@router.post(
    "/tasks/{task_id}/transition",
    response_model=TaskOut,
    summary="Transition a task",
    description=(
        "Move a task to a new state. Valid moves follow the A2A v1.0 subset: "
        "submitted→working/canceled, working→input_required/completed/failed/canceled, "
        "input_required→working/canceled. Terminal states cannot be left."
    ),
)
async def transition_task(
    task_id: str,
    body: TaskTransitionBody,
    server: OctopServer = Depends(get_server),
    user: Any = Depends(current_user),
) -> TaskOut:
    row = _service(server).transition(
        task_id=task_id,
        user_id=user.id,
        to_state=body.status,
        result=body.result,
        error=body.error,
    )
    return _out(row)
