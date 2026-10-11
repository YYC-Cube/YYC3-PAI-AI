"""A2A-style stateful task lifecycle engine.

Task states follow the A2A v1.0 TaskState vocabulary (subset): a task is
dispatched as ``submitted``, moves to ``working``, may ask for more input
(``input_required``), and ends in one of the terminal states ``completed``,
``failed`` or ``canceled``. Cron triggers stay orthogonal: this engine models
explicitly created, long-lived tasks (e.g. family task dispatch loops), not
periodic execution.

``lifecycle`` is pure logic (no I/O); ``service`` wires the repo.
"""

from octop.infra.tasks.lifecycle import (
    TASK_STATES,
    TERMINAL_STATES,
    TaskState,
    assert_actor_transition,
    assert_transition,
    can_transition,
)
from octop.infra.tasks.service import TaskService

__all__ = [
    "TASK_STATES",
    "TERMINAL_STATES",
    "TaskService",
    "TaskState",
    "assert_actor_transition",
    "assert_transition",
    "can_transition",
]
