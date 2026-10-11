"""Stateful task lifecycle API (A2A v1.0 TaskState subset) + family dispatch loop.

User-scoped visibility: a task is visible to its creator and its assignee.
Task execution by agents is intentionally out of scope here — this surface
models the lifecycle (dispatch → acknowledge → execute → feedback) that
family-task dispatch loops and future A2A task endpoints share.

Family loop (v22): admins (家长) dispatch tasks to other members via
``assignee_user_id``; the assignee acknowledges (submitted→working), may ask
for input (working⇄input_required), and reports completion; either side can
cancel (撤回/拒绝). State changes notify the counterpart over their most
recent IM session, best-effort (mirrors cron delivery).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from octop.api.deps import current_user, get_server
from octop.infra.db.repos.tasks import TaskRow
from octop.infra.server import OctopServer
from octop.infra.tasks import TASK_STATES, TaskService
from octop.infra.tasks.delivery import TaskDelivery

router = APIRouter()


class TaskCreateBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    instruction: str | None = Field(default=None, max_length=20000)
    agent_id: str | None = Field(default=None, max_length=100)
    assignee_user_id: int | None = Field(
        default=None,
        description="Dispatch target (another household member). Admins only; omit for a personal task.",
    )
    due_at: int | None = Field(
        default=None,
        description="Follow-up deadline as epoch seconds.",
    )


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
    assignee_user_id: int | None
    due_at: int | None


class TaskListOut(BaseModel):
    tasks: list[TaskOut]
    states: list[str] = Field(default_factory=lambda: list(TASK_STATES))


def _service(server: OctopServer) -> TaskService:
    assert server.services is not None
    return TaskService(
        repo=server.services.repos.task_repo,
        user_repo=server.services.repos.user_repo,
    )


def _delivery(server: OctopServer) -> TaskDelivery:
    assert server.services is not None
    gateway = server.app_runtime.gateway if server.app_runtime is not None else None
    return TaskDelivery(
        session_repo=server.services.repos.session_repo,
        user_repo=server.services.repos.user_repo,
        gateway=gateway,
    )


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
        assignee_user_id=row.assignee_user_id,
        due_at=row.due_at,
    )


@router.post(
    "/tasks",
    response_model=TaskOut,
    status_code=201,
    summary="Create a task",
    description=(
        "Create a task in the ``submitted`` state. Optionally bind it to an "
        "agent, give it an instruction payload, dispatch it to another member "
        "(admins only, ``assignee_user_id``), and set a follow-up deadline "
        "(``due_at``, epoch seconds)."
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
        assignee_user_id=body.assignee_user_id,
        due_at=body.due_at,
        actor_is_admin=bool(getattr(user, "is_admin", False)),
    )
    if row.assignee_user_id is not None and row.assignee_user_id != row.user_id:
        await _delivery(server).notify(
            task=row,
            event="dispatched",
            actor_user_id=user.id,
            actor_username=user.username,
        )
    return _out(row)


@router.get(
    "/tasks",
    response_model=TaskListOut,
    summary="List my tasks",
    description=(
        "List tasks visible to the current user (created by or assigned to "
        "them), newest activity first. ``role`` picks the bucket: created / "
        "assigned / all (default)."
    ),
)
async def list_tasks(
    status: str | None = Query(default=None),
    role: str = Query(default="all"),
    limit: int = Query(default=100, ge=1, le=500),
    server: OctopServer = Depends(get_server),
    user: Any = Depends(current_user),
) -> TaskListOut:
    rows = _service(server).list_for_user(user_id=user.id, status=status, role=role, limit=limit)
    return TaskListOut(tasks=[_out(r) for r in rows])


@router.get(
    "/tasks/{task_id}",
    response_model=TaskOut,
    summary="Get a task",
    description="Fetch one task visible to the current user by its public id.",
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
        "Move a task to a new state with actor rules. Valid moves follow the "
        "A2A v1.0 subset: submitted→working/canceled, "
        "working→input_required/completed/failed/canceled, "
        "input_required→working/canceled; terminal states cannot be left. "
        "The assignee performs accept/continue/question/complete; either side "
        "can cancel (creator 撤回, assignee 拒绝)."
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
    if row.assignee_user_id is not None and row.assignee_user_id != row.user_id:
        event = {
            "working": "accepted",
            "completed": "completed",
            "canceled": "canceled",
            "input_required": "input_required",
        }.get(row.status)
        if event is not None:
            await _delivery(server).notify(
                task=row,
                event=event,
                actor_user_id=user.id,
                actor_username=user.username,
            )
    return _out(row)
