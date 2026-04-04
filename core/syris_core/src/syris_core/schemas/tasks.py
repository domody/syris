from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


TaskStatus = Literal["pending", "running", "completed", "failed", "cancelled", "paused"]

StepStatus = Literal["pending", "running", "completed", "failed", "skipped", "gated"]


class RetryPolicy(BaseModel):
    """Retry configuration for a task step."""

    max_attempts: int = Field(default=3, ge=1)
    backoff_s: float = Field(default=1.0, ge=0.0)


class TaskStep(BaseModel):
    """
    A single unit of work within a Task.

    Steps execute in order (step_index ascending). Each step maps to one
    tool invocation. The idempotency_key ensures a step's side effects are
    never duplicated across retries or crash recovery.
    """

    step_id: UUID = Field(default_factory=uuid4)
    task_id: UUID
    step_index: int = Field(ge=0)
    status: StepStatus = "pending"
    tool_name: str
    input_payload: dict[str, Any] = Field(default_factory=dict)
    output_payload: Optional[dict[str, Any]] = None
    idempotency_key: str
    attempt_count: int = Field(default=0, ge=0)
    max_attempts: int = Field(default=3, ge=1)
    risk_level: str = "low"
    pending_approval_id: Optional[UUID] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"frozen": True}


class Task(BaseModel):
    """
    A multi-step workflow unit.

    Tasks are persisted to the DB on creation. The engine claims pending tasks
    with FOR UPDATE SKIP LOCKED and drives them through their steps until
    completion, failure, or cancellation.
    """

    task_id: UUID = Field(default_factory=uuid4)
    trace_id: UUID
    status: TaskStatus = "pending"
    handler: str
    input_payload: dict[str, Any] = Field(default_factory=dict)
    checkpoint: dict[str, Any] = Field(default_factory=dict)
    retry_policy: RetryPolicy = Field(default_factory=RetryPolicy)
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"frozen": True}


class TaskSubmit(BaseModel):
    """Request body for submitting a new task via the API."""

    trace_id: UUID = Field(default_factory=uuid4)
    handler: str
    input_payload: dict[str, Any] = Field(default_factory=dict)
    retry_policy: RetryPolicy = Field(default_factory=RetryPolicy)
    steps: list["StepSpec"]


class StepSpec(BaseModel):
    """Specification for a single step when submitting a task."""

    tool_name: str
    input_payload: dict[str, Any] = Field(default_factory=dict)
    max_attempts: int = Field(default=3, ge=1)
    risk_level: Literal["low", "medium", "high", "critical"] = "low"
