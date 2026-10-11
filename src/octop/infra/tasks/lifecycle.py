"""Pure task state machine — A2A v1.0 TaskState subset.

No I/O. The service layer (and API above it) drives transitions through
``assert_transition`` so invalid moves are rejected before touching storage.
"""

from __future__ import annotations

from octop.infra.errors import ErrorCode, OctopError

TaskState = str

TASK_SUBMITTED: TaskState = "submitted"
TASK_WORKING: TaskState = "working"
TASK_INPUT_REQUIRED: TaskState = "input_required"
TASK_COMPLETED: TaskState = "completed"
TASK_FAILED: TaskState = "failed"
TASK_CANCELED: TaskState = "canceled"

TASK_STATES: tuple[TaskState, ...] = (
    TASK_SUBMITTED,
    TASK_WORKING,
    TASK_INPUT_REQUIRED,
    TASK_COMPLETED,
    TASK_FAILED,
    TASK_CANCELED,
)

TERMINAL_STATES: frozenset[TaskState] = frozenset({TASK_COMPLETED, TASK_FAILED, TASK_CANCELED})

_TRANSITIONS: dict[TaskState, tuple[TaskState, ...]] = {
    TASK_SUBMITTED: (TASK_WORKING, TASK_CANCELED),
    TASK_WORKING: (TASK_INPUT_REQUIRED, TASK_COMPLETED, TASK_FAILED, TASK_CANCELED),
    TASK_INPUT_REQUIRED: (TASK_WORKING, TASK_CANCELED),
    TASK_COMPLETED: (),
    TASK_FAILED: (),
    TASK_CANCELED: (),
}


def is_valid_state(state: TaskState) -> bool:
    return state in _TRANSITIONS


def is_terminal(state: TaskState) -> bool:
    return state in TERMINAL_STATES


def can_transition(from_state: TaskState, to_state: TaskState) -> bool:
    return to_state in _TRANSITIONS.get(from_state, ())


def assert_transition(from_state: TaskState, to_state: TaskState) -> None:
    if not is_valid_state(from_state) or not is_valid_state(to_state):
        raise OctopError(
            ErrorCode.TASK_INVALID_STATUS,
            f"unknown task state: {from_state!r} -> {to_state!r}",
        )
    if not can_transition(from_state, to_state):
        raise OctopError(
            ErrorCode.TASK_INVALID_TRANSITION,
            f"cannot transition task from {from_state!r} to {to_state!r}",
            details={"from": from_state, "to": to_state},
        )


# --- family loop: actor-aware transitions -----------------------------------
#
# The state machine above defines which moves exist; the family loop adds WHO
# may perform them. Creator = the dispatching member (``user_id``), assignee =
# the member the task was dispatched to (``assignee_user_id``). A personal task
# has creator == assignee.
#
#   · 接受/继续 (→ working), 提问 (→ input_required), 完成/失败 (→ completed/
#     failed) belong to the assignee — the person doing the work.
#   · 撤回/拒绝 (→ canceled) may come from either side while non-terminal.


def assert_actor_transition(
    *,
    actor_is_creator: bool,
    actor_is_assignee: bool,
    from_state: TaskState,
    to_state: TaskState,
) -> None:
    """Validate state move AND the acting party (family dispatch loop)."""
    assert_transition(from_state, to_state)
    if actor_is_assignee and not actor_is_creator:
        if to_state == TASK_CANCELED:
            return  # 拒绝 / 取消自己的任务
        if from_state in (TASK_SUBMITTED, TASK_INPUT_REQUIRED) and to_state == TASK_WORKING:
            return  # 接受 / 补充后继续
        if from_state == TASK_WORKING and to_state == TASK_INPUT_REQUIRED:
            return  # 执行中需要对方补充信息
        if from_state == TASK_WORKING and to_state in (TASK_COMPLETED, TASK_FAILED):
            return  # 完成 / 失败汇报
        raise OctopError(
            ErrorCode.TASK_INVALID_TRANSITION,
            f"assignee cannot transition task from {from_state!r} to {to_state!r}",
            details={"from": from_state, "to": to_state},
        )
    if actor_is_creator and not actor_is_assignee:
        if to_state == TASK_CANCELED:
            return  # 撤回
        raise OctopError(
            ErrorCode.TASK_INVALID_TRANSITION,
            f"creator cannot transition task from {from_state!r} to {to_state!r}",
            details={"from": from_state, "to": to_state},
        )
    if not (actor_is_creator or actor_is_assignee):
        raise OctopError(
            ErrorCode.TASK_INVALID_TRANSITION,
            "actor has no role on this task",
            details={"from": from_state, "to": to_state},
        )
    # Personal task (actor is both creator and assignee): any valid move goes.
    assert_transition(from_state, to_state)
