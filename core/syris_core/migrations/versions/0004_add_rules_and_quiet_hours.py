"""add rules, quiet_hours_policies, and parent_event_id

Revision ID: 0004
Revises: 0002, 4579e584980f
Create Date: 2026-04-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID

revision: str = "0004"
down_revision: Union[str, tuple] = ("0002", "4579e584980f")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quiet_hours_policies",
        sa.Column("policy_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("start_hour", sa.Integer(), nullable=False),
        sa.Column("end_hour", sa.Integer(), nullable=False),
        sa.Column("timezone", sa.Text(), nullable=False, server_default="UTC"),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    )

    op.create_table(
        "rules",
        sa.Column("rule_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("conditions", JSONB(), nullable=False, server_default="[]"),
        sa.Column("action", JSONB(), nullable=False, server_default="{}"),
        sa.Column("debounce_s", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_fired_at", TIMESTAMP(timezone=True), nullable=True),
        sa.Column("suppression_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fire_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("quiet_hours_policy_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    )
    op.create_index("ix_rules_enabled", "rules", ["enabled"])

    op.add_column(
        "message_events",
        sa.Column("parent_event_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_message_events_parent_event_id", "message_events", ["parent_event_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_message_events_parent_event_id", table_name="message_events")
    op.drop_column("message_events", "parent_event_id")
    op.drop_index("ix_rules_enabled", table_name="rules")
    op.drop_table("rules")
    op.drop_table("quiet_hours_policies")
