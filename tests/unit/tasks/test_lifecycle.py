"""Unit tests for the pure task state machine."""

from __future__ import annotations

import pytest

from octop.infra.errors import ErrorCode, OctopError
from octop.infra.tasks import (
    TASK_STATES,
    TERMINAL_STATES,
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
