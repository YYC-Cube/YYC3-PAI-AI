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
