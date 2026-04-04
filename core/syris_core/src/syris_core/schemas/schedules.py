from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

ScheduleType = Literal["cron", "interval", "one_shot"]
CatchUpPolicy = Literal["skip", "run_once", "run_all_capped"]


class ScheduleCreate(BaseModel):
    """Request body for creating a schedule."""

    name: str
    enabled: bool = True
    schedule_type: ScheduleType
    cron_expr: Optional[str] = None
    interval_s: Optional[int] = Field(default=None, ge=1)
    run_at: Optional[datetime] = None
    timezone: str = "UTC"
    quiet_hours_start: Optional[int] = Field(default=None, ge=0, le=23)
    quiet_hours_end: Optional[int] = Field(default=None, ge=0, le=23)
    catch_up_policy: CatchUpPolicy = "skip"
    catch_up_max: Optional[int] = Field(default=None, ge=1)
    event_source: str
    event_content: str = ""
    event_structured: dict[str, Any] = Field(default_factory=dict)


class SchedulePatch(BaseModel):
    """Request body for patching a schedule (all fields optional)."""

    name: Optional[str] = None
    enabled: Optional[bool] = None
    cron_expr: Optional[str] = None
    interval_s: Optional[int] = Field(default=None, ge=1)
    run_at: Optional[datetime] = None
    timezone: Optional[str] = None
    quiet_hours_start: Optional[int] = Field(default=None, ge=0, le=23)
    quiet_hours_end: Optional[int] = Field(default=None, ge=0, le=23)
    catch_up_policy: Optional[CatchUpPolicy] = None
    catch_up_max: Optional[int] = Field(default=None, ge=1)
    event_source: Optional[str] = None
    event_content: Optional[str] = None
    event_structured: Optional[dict[str, Any]] = None


class Schedule(BaseModel):
    """Full schedule representation returned by the API."""

    schedule_id: UUID
    name: str
    enabled: bool
    schedule_type: ScheduleType
    cron_expr: Optional[str]
    interval_s: Optional[int]
    run_at: Optional[datetime]
    timezone: str
    quiet_hours_start: Optional[int]
    quiet_hours_end: Optional[int]
    catch_up_policy: CatchUpPolicy
    catch_up_max: Optional[int]
    event_source: str
    event_content: str
    event_structured: dict[str, Any]
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    fire_count: int
    created_at: datetime
    updated_at: datetime
