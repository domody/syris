from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class RuleCondition(BaseModel):
    """A single condition to match against a MessageEvent field."""

    field: str  # "source", "content", "structured.KEY", "structured.a.b"
    op: Literal["eq", "contains", "matches", "has_key"]
    value: Any = None  # unused for has_key


class RuleAction(BaseModel):
    """Action to take when a rule fires."""

    type: Literal["emit_event"]
    source: str
    content: str = ""
    structured: dict[str, Any] = Field(default_factory=dict)


class RuleCreate(BaseModel):
    """Request body for creating a rule."""

    name: str
    enabled: bool = True
    conditions: list[RuleCondition]
    action: RuleAction
    debounce_s: int = Field(default=0, ge=0)
    quiet_hours_policy_id: Optional[UUID] = None


class RulePatch(BaseModel):
    """Request body for patching a rule (all fields optional)."""

    name: Optional[str] = None
    enabled: Optional[bool] = None
    conditions: Optional[list[RuleCondition]] = None
    action: Optional[RuleAction] = None
    debounce_s: Optional[int] = Field(default=None, ge=0)
    quiet_hours_policy_id: Optional[UUID] = None


class Rule(BaseModel):
    """Full rule representation returned by the API."""

    rule_id: UUID
    name: str
    enabled: bool
    conditions: list[RuleCondition]
    action: RuleAction
    debounce_s: int
    last_fired_at: Optional[datetime]
    suppression_count: int
    fire_count: int
    quiet_hours_policy_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class QuietHoursPolicyCreate(BaseModel):
    """Request body for creating a quiet hours policy."""

    name: str
    start_hour: int = Field(ge=0, le=23)
    end_hour: int = Field(ge=0, le=23)
    timezone: str = "UTC"


class QuietHoursPolicyPatch(BaseModel):
    """Request body for patching a quiet hours policy (all fields optional)."""

    name: Optional[str] = None
    start_hour: Optional[int] = Field(default=None, ge=0, le=23)
    end_hour: Optional[int] = Field(default=None, ge=0, le=23)
    timezone: Optional[str] = None


class QuietHoursPolicy(BaseModel):
    """Full quiet hours policy representation returned by the API."""

    policy_id: UUID
    name: str
    start_hour: int
    end_hour: int
    timezone: str
    created_at: datetime
    updated_at: datetime
