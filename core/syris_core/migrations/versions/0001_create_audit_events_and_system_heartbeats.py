"""create audit_events and system_health tables

Revision ID: 0001
Revises:
Create Date: 2026-03-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_events",
        sa.Column("audit_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("timestamp", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("trace_id", UUID(as_uuid=True), nullable=False),
        sa.Column("stage", sa.Text(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("outcome", sa.Text(), nullable=False),
        sa.Column("ref_event_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ref_task_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ref_step_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ref_tool_call_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ref_approval_id", UUID(as_uuid=True), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("tool_name", sa.Text(), nullable=True),
        sa.Column("connector_id", sa.Text(), nullable=True),
        sa.Column("risk_level", sa.Text(), nullable=True),
        sa.Column("autonomy_level", sa.Text(), nullable=True),
        sa.Column("payload_ref", sa.Text(), nullable=True),
    )
    op.create_index("ix_audit_events_trace_id", "audit_events", ["trace_id"])
    op.create_index("ix_audit_events_timestamp", "audit_events", ["timestamp"])

    op.create_table(
        "system_health",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("run_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ts", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="healthy"),
        sa.Column("uptime_s", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("service", sa.String(64), nullable=False, server_default="syris-core"),
        sa.Column("version", sa.String(64), nullable=False, server_default=""),
    )
    op.create_index("ix_system_health_ts", "system_health", ["ts"])
    op.create_index("ix_system_health_run_id", "system_health", ["run_id"])


def downgrade() -> None:
    op.drop_index("ix_system_health_run_id", table_name="system_health")
    op.drop_index("ix_system_health_ts", table_name="system_health")
    op.drop_table("system_health")

    op.drop_index("ix_audit_events_timestamp", table_name="audit_events")
    op.drop_index("ix_audit_events_trace_id", table_name="audit_events")
    op.drop_table("audit_events")
