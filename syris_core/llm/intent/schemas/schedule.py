from datetime import datetime

from pydantic import BaseModel, Field


class ScheduleSetTimerArgs(BaseModel):
    duration_seconds: int | None = Field(
        default=None,
        description="Timer duration in seconds, if explicitly provided.",
    )
    time_expression: str | None = Field(
        default=None,
        description="Natural language duration like '25 minutes' or '2 hours'.",
    )
    label: str | None = Field(
        default=None,
        description="Optional user-facing label for the timer.",
    )


class ScheduleSetAlarmArgs(BaseModel):
    run_at: datetime | None = Field(
        default=None,
        description="Exact timestamp for the alarm if resolved.",
    )
    time_expression: str | None = Field(
        default=None,
        description="Natural language time like '6:30am' or 'tomorrow at 7'.",
    )
    label: str | None = Field(
        default=None,
        description="Optional user-facing label for the alarm.",
    )


class ScheduleSetReminderArgs(BaseModel):
    run_at: datetime | None = Field(
        default=None,
        description="Exact timestamp for the reminder if resolved.",
    )
    time_expression: str | None = Field(
        default=None,
        description="Natural language date/time like 'Friday at 3pm'.",
    )
    message: str | None = Field(
        default=None,
        description="Reminder message or action the user wants to be reminded about.",
    )
    label: str | None = Field(
        default=None,
        description="Optional user-facing label for the reminder.",
    )
