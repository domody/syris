"""
Task and Step state machines.

All valid transitions are enumerated explicitly. Any attempted transition
not in the allowed set raises IllegalStateTransition immediately — callers
must never guess whether a transition is valid.
"""
from syris_core.schemas.tasks import StepStatus, TaskStatus

# (from_status, to_status) → description
_TASK_TRANSITIONS: dict[tuple[str, str], str] = {
    ("pending", "running"): "claim",
    ("pending", "cancelled"): "operator cancel before claim",
    ("running", "completed"): "all steps done",
    ("running", "failed"): "step failed unrecoverably",
    ("running", "paused"): "operator pause",
    ("running", "cancelled"): "operator cancel from running",
    ("paused", "running"): "operator resume",
    ("paused", "cancelled"): "operator cancel from paused",
}

_STEP_TRANSITIONS: dict[tuple[str, str], str] = {
    ("pending", "running"): "start step",
    ("running", "completed"): "step succeeded",
    ("running", "failed"): "exhausted retries",
    ("running", "pending"): "retry — reset for re-attempt",
    ("pending", "skipped"): "skip step",
}


class IllegalStateTransition(Exception):
    """Raised when a state transition is not allowed."""


def assert_task_transition(current: TaskStatus, next_: TaskStatus) -> None:
    """Raise IllegalStateTransition if (current → next_) is not a valid task transition."""
    if (current, next_) not in _TASK_TRANSITIONS:
        raise IllegalStateTransition(
            f"Invalid task transition: {current!r} → {next_!r}. "
            f"Allowed from {current!r}: "
            f"{[t for f, t in _TASK_TRANSITIONS if f == current]}"
        )


def assert_step_transition(current: StepStatus, next_: StepStatus) -> None:
    """Raise IllegalStateTransition if (current → next_) is not a valid step transition."""
    if (current, next_) not in _STEP_TRANSITIONS:
        raise IllegalStateTransition(
            f"Invalid step transition: {current!r} → {next_!r}. "
            f"Allowed from {current!r}: "
            f"{[t for f, t in _STEP_TRANSITIONS if f == current]}"
        )
