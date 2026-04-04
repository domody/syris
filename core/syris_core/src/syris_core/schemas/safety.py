from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

ApprovalStatus = Literal["pending", "approved", "denied", "expired"]
GateAction = Literal["ALLOW", "CONFIRM", "PREVIEW", "HARD_BLOCK"]


class Approval(BaseModel):
    """
    Persisted gate record created when an action requires operator confirmation.

    Created by GateChecker when the gate matrix returns CONFIRM. The action
    payload in `what` is the exact serialised request that will execute on
    approval — no surprises.
    """

    approval_id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    status: ApprovalStatus = "pending"
    trace_id: UUID
    ref_event_id: Optional[UUID] = None
    ref_task_id: Optional[UUID] = None
    ref_step_id: Optional[UUID] = None
    risk_level: str
    autonomy_level: str
    what: dict[str, Any]
    why: str
    how_to_approve: str
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    decision_reason: Optional[str] = None

    model_config = {"frozen": True}


class GateDecision(BaseModel):
    """Result of a gate check, returned by GateChecker.check()."""

    action: GateAction
    reason: str
    approval: Optional[Approval] = None

    model_config = {"frozen": True}


class AutonomySetting(BaseModel):
    """Current autonomy level configuration."""

    level: str  # A0 | A1 | A2 | A3 | A4
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None

    model_config = {"frozen": True}


class SetAutonomyRequest(BaseModel):
    """Request body for POST /controls/autonomy."""

    level: Literal["A0", "A1", "A2", "A3", "A4"]
    reason: Optional[str] = None


class ApproveRequest(BaseModel):
    """Request body for POST /approvals/{id}/approve."""

    reason: Optional[str] = None


class DenyRequest(BaseModel):
    """Request body for POST /approvals/{id}/deny."""

    reason: Optional[str] = None
