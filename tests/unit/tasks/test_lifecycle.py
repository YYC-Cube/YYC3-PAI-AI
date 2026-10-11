"""Unit tests for the pure task state machine."""

from __future__ import annotations

import pytest

from octop.infra.errors import ErrorCode, OctopError
from octop.infra.tasks import (
    TASK_STATES,
    TERMINAL_STATES,
    assert_actor_transition,
    assert_transition,
    can_transition,
    lifecycle,
)


def test_all_states_registered() -> None:
    assert TASK_STATES == (
        "submitted",
        "working",
        "input_required",
        "completed",
        "failed",
        "canceled",
    )
    assert frozenset({"completed", "failed", "canceled"}) == TERMINAL_STATES


def test_happy_path_dispatch_loop() -> None:
    assert_transition("submitted", "working")
    assert_transition("working", "input_required")
    assert_transition("input_required", "working")
    assert_transition("working", "completed")


def test_terminal_states_are_absorbing() -> None:
    for terminal in ("completed", "failed", "canceled"):
        for target in TASK_STATES:
            assert not can_transition(terminal, target)


def test_invalid_moves() -> None:
    assert not can_transition("submitted", "completed")
    assert not can_transition("submitted", "input_required")
    assert not can_transition("submitted", "failed")
    assert not can_transition("working", "submitted")
    assert not can_transition("input_required", "completed")
    assert not can_transition("canceled", "working")


def test_assert_transition_raises_with_details() -> None:
    with pytest.raises(OctopError) as excinfo:
        assert_transition("submitted", "completed")
    err = excinfo.value
    assert err.code == ErrorCode.TASK_INVALID_TRANSITION
    assert err.status == 409
    assert err.details == {"from": "submitted", "to": "completed"}


def test_unknown_states_raise_invalid_status() -> None:
    with pytest.raises(OctopError) as excinfo:
        assert_transition("bogus", "working")
    assert excinfo.value.code == ErrorCode.TASK_INVALID_STATUS
    assert not lifecycle.is_valid_state("bogus")
    assert lifecycle.is_terminal("completed")
    assert not lifecycle.is_terminal("working")


# --- family loop: actor-aware transitions -------------------------------------


def test_assignee_accepts_questions_and_completes() -> None:
    # 接受
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="submitted",
        to_state="working",
    )
    # 执行中提问
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="working",
        to_state="input_required",
    )
    # 补充后继续
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="input_required",
        to_state="working",
    )
    # 完成 / 失败汇报
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="working",
        to_state="completed",
    )
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="working",
        to_state="failed",
    )


def test_assignee_can_reject_and_cancel() -> None:
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="submitted",
        to_state="canceled",
    )
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="working",
        to_state="canceled",
    )
    assert_actor_transition(
        actor_is_creator=False,
        actor_is_assignee=True,
        from_state="input_required",
        to_state="canceled",
    )


def test_assignee_cannot_skip_states_or_touch_terminal() -> None:
    with pytest.raises(OctopError) as excinfo:
        assert_actor_transition(
            actor_is_creator=False,
            actor_is_assignee=True,
            from_state="submitted",
            to_state="completed",
        )
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION
    with pytest.raises(OctopError) as excinfo:
        assert_actor_transition(
            actor_is_creator=False,
            actor_is_assignee=True,
            from_state="completed",
            to_state="canceled",
        )
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION


def test_creator_can_recall_but_not_progress() -> None:
    assert_actor_transition(
        actor_is_creator=True,
        actor_is_assignee=False,
        from_state="submitted",
        to_state="canceled",
    )
    with pytest.raises(OctopError) as excinfo:
        assert_actor_transition(
            actor_is_creator=True,
            actor_is_assignee=False,
            from_state="submitted",
            to_state="working",
        )
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION
    with pytest.raises(OctopError) as excinfo:
        assert_actor_transition(
            actor_is_creator=True,
            actor_is_assignee=False,
            from_state="working",
            to_state="completed",
        )
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION


def test_creator_cannot_cancel_terminal() -> None:
    with pytest.raises(OctopError) as excinfo:
        assert_actor_transition(
            actor_is_creator=True,
            actor_is_assignee=False,
            from_state="completed",
            to_state="canceled",
        )
    assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION


def test_unrelated_actor_rejected_even_for_cancel() -> None:
    for to_state in ("working", "canceled"):
        with pytest.raises(OctopError) as excinfo:
            assert_actor_transition(
                actor_is_creator=False,
                actor_is_assignee=False,
                from_state="submitted",
                to_state=to_state,
            )
        assert excinfo.value.code == ErrorCode.TASK_INVALID_TRANSITION


def test_personal_task_full_control() -> None:
    assert_actor_transition(
        actor_is_creator=True,
        actor_is_assignee=True,
        from_state="submitted",
        to_state="working",
    )
    assert_actor_transition(
        actor_is_creator=True,
        actor_is_assignee=True,
        from_state="working",
        to_state="completed",
    )
    assert_actor_transition(
        actor_is_creator=True,
        actor_is_assignee=True,
        from_state="submitted",
        to_state="canceled",
    )
