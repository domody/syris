"""create schedules and watcher_states tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID

revision: str = "0003"
down_revision: Union[str, None] = "f39fed3a5b4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "schedules",
        sa.Column("schedule_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("schedule_type", sa.Text(), nullable=False),
        sa.Column("cron_expr", sa.Text(), nullable=True),
        sa.Column("interval_s", sa.Integer(), nullable=True),
        sa.Column("run_at", TIMESTAMP(timezone=True), nullable=True),
        sa.Column("timezone", sa.Text(), nullable=False, server_default="UTC"),
        sa.Column("quiet_hours_start", sa.Integer(), nullable=True),
        sa.Column("quiet_hours_end", sa.Integer(), nullable=True),
        sa.Column("catch_up_policy", sa.Text(), nullable=False, server_default="skip"),
        sa.Column("catch_up_max", sa.Integer(), nullable=True),
        sa.Column("event_source", sa.Text(), nullable=False),
        sa.Column("event_content", sa.Text(), nullable=False, server_default=""),
        sa.Column("event_structured", JSONB(), nullable=False, server_default="{}"),
        sa.Column("next_run_at", TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_run_at", TIMESTAMP(timezone=True), nullable=True),
        sa.Column("fire_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    )
    op.create_index("ix_schedules_next_run_at", "schedules", ["next_run_at"])
    op.create_index("ix_schedules_enabled", "schedules", ["enabled"])

    op.create_table(
        "watcher_states",
        sa.Column("watcher_id", sa.Text(), primary_key=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_tick_at", TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_outcome", sa.Text(), nullable=True),
        sa.Column("dedupe_window", JSONB(), nullable=False, server_default="{}"),
        sa.Column("consecutive_errors", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("suppression_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("watcher_states")
    op.drop_index("ix_schedules_enabled", table_name="schedules")
    op.drop_index("ix_schedules_next_run_at", table_name="schedules")
    op.drop_table("schedules")
