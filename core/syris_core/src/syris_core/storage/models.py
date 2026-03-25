import uuid
from datetime import datetime, timezone
from typing import ClassVar, Optional

from sqlalchemy import Column, Index, Integer, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID as PGUUID
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
