import uuid
from datetime import datetime, timezone
from typing import Any, ClassVar, Optional

from sqlalchemy import Boolean, Column, Index, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID as PGUUID
from sqlmodel import SQLModel, Field


class SystemHeartbeatRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "system_health"
    __table_args__: tuple = (
        Index("ix_system_health_ts", "ts"),
        Index("ix_system_health_run_id", "run_id"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        # primary_key=True,
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    run_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), nullable=False),
    )
    ts: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    status: str = Field(default="healthy", max_length=32)
    uptime_s: int = Field(default=0, ge=0)
    service: str = Field(default="syris-core", max_length=64)
    version: str = Field(default="", max_length=64)


class AuditEventRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "audit_events"
    __table_args__: tuple = (
        Index("ix_audit_events_trace_id", "trace_id"),
        Index("ix_audit_events_timestamp", "timestamp"),
    )

    audit_id: uuid.UUID = Field(
        # primary_key=True,
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    timestamp: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    trace_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), nullable=False),
    )
    stage: str = Field(sa_column=Column(Text, nullable=False))
    type: str = Field(sa_column=Column(Text, nullable=False))
    summary: str = Field(sa_column=Column(Text, nullable=False))
    outcome: str = Field(sa_column=Column(Text, nullable=False))

    ref_event_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    ref_task_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    ref_step_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    ref_tool_call_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    ref_approval_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )

    latency_ms: Optional[int] = Field(
        default=None, sa_column=Column(Integer, nullable=True)
    )
    tool_name: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    connector_id: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    risk_level: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    autonomy_level: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    payload_ref: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )


class MessageEventRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "message_events"
    __table_args__: tuple = (
        Index("ix_message_events_trace_id", "trace_id"),
        Index("ix_message_events_created_at", "created_at"),
        Index("ix_message_events_idempotency_key", "idempotency_key"),
    )

    event_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    trace_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), nullable=False),
    )
    created_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    source: str = Field(sa_column=Column(Text, nullable=False))
    content: str = Field(sa_column=Column(Text, nullable=False, server_default=""))
    structured: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    content_type: str = Field(default="text/plain", sa_column=Column(Text, nullable=False))
    idempotency_key: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )


class TaskRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "tasks"
    __table_args__: tuple = (
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_trace_id", "trace_id"),
    )

    task_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    trace_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), nullable=False),
    )
    status: str = Field(sa_column=Column(Text, nullable=False))
    handler: str = Field(sa_column=Column(Text, nullable=False))
    input_payload: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    checkpoint: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    retry_policy: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    error: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    started_at: Optional[datetime] = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )
    completed_at: Optional[datetime] = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )


class TaskStepRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "task_steps"
    __table_args__: tuple = (
        Index("ix_task_steps_task_id", "task_id"),
        Index("ix_task_steps_status", "status"),
    )

    step_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    task_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), nullable=False),
    )
    step_index: int = Field(sa_column=Column(Integer, nullable=False))
    status: str = Field(sa_column=Column(Text, nullable=False))
    tool_name: str = Field(sa_column=Column(Text, nullable=False))
    input_payload: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    output_payload: Optional[dict[str, Any]] = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    idempotency_key: str = Field(sa_column=Column(Text, nullable=False, unique=True))
    attempt_count: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    max_attempts: int = Field(default=3, sa_column=Column(Integer, nullable=False))
    risk_level: str = Field(default="low", sa_column=Column(Text, nullable=False, server_default="low"))
    pending_approval_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    error: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    started_at: Optional[datetime] = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )
    completed_at: Optional[datetime] = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )


class ApprovalRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "approvals"
    __table_args__: tuple = (
        Index("ix_approvals_status", "status"),
        Index("ix_approvals_trace_id", "trace_id"),
        Index("ix_approvals_expires_at", "expires_at"),
        Index("ix_approvals_ref_step_id", "ref_step_id"),
    )

    approval_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    expires_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    status: str = Field(sa_column=Column(Text, nullable=False))
    trace_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), nullable=False),
    )
    ref_event_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    ref_task_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    ref_step_id: Optional[uuid.UUID] = Field(
        default=None, sa_column=Column(PGUUID(as_uuid=True), nullable=True)
    )
    risk_level: str = Field(sa_column=Column(Text, nullable=False))
    autonomy_level: str = Field(sa_column=Column(Text, nullable=False))
    what: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    why: str = Field(sa_column=Column(Text, nullable=False))
    how_to_approve: str = Field(sa_column=Column(Text, nullable=False))
    decided_by: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    decided_at: Optional[datetime] = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )
    decision_reason: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))


class AutonomySettingRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "autonomy_settings"

    setting_id: str = Field(
        default="current",
        sa_column=Column(Text, primary_key=True),
    )
    level: str = Field(sa_column=Column(Text, nullable=False))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    updated_by: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))


class ScheduleRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "schedules"
    __table_args__: tuple = (
        Index("ix_schedules_next_run_at", "next_run_at"),
        Index("ix_schedules_enabled", "enabled"),
    )

    schedule_id: uuid.UUID = Field(
        sa_column=Column(PGUUID(as_uuid=True), primary_key=True),
    )
    name: str = Field(sa_column=Column(Text, nullable=False))
    enabled: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default="true"))
    schedule_type: str = Field(sa_column=Column(Text, nullable=False))
    cron_expr: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    interval_s: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    run_at: Optional[datetime] = Field(default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True))
    timezone: str = Field(default="UTC", sa_column=Column(Text, nullable=False, server_default="UTC"))
    quiet_hours_start: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    quiet_hours_end: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    catch_up_policy: str = Field(default="skip", sa_column=Column(Text, nullable=False, server_default="skip"))
    catch_up_max: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    event_source: str = Field(sa_column=Column(Text, nullable=False))
    event_content: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=""))
    event_structured: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    next_run_at: Optional[datetime] = Field(default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True))
    last_run_at: Optional[datetime] = Field(default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True))
    fire_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )


class WatcherStateRow(SQLModel, table=True):
    __tablename__: ClassVar[str] = "watcher_states"

    watcher_id: str = Field(sa_column=Column(Text, primary_key=True))
    enabled: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default="true"))
    last_tick_at: Optional[datetime] = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )
    last_outcome: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    dedupe_window: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    consecutive_errors: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    suppression_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )
