"""add memory tables and significance columns

Revision ID: 0005
Revises: 031a9f693983
Create Date: 2026-05-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID as PGUUID

revision: str = "0005"
down_revision: Union[str, None] = "031a9f693983"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- message_events: add significance + anchor + memory_processed_at columns ---
    op.add_column(
        "message_events",
        sa.Column("significance_score", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.add_column(
        "message_events",
        sa.Column("significance_tags", JSONB(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "message_events",
        sa.Column("is_anchor", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "message_events",
        sa.Column("anchor_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "message_events",
        sa.Column("memory_processed_at", TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_message_events_is_anchor", "message_events", ["is_anchor"])
    op.create_index(
        "ix_message_events_memory_processed_at", "message_events", ["memory_processed_at"]
    )

    # --- memory_episodes ---
    op.create_table(
        "memory_episodes",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("covers_from", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("covers_to", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("topics", JSONB(), nullable=False, server_default="[]"),
        sa.Column("tools_invoked", JSONB(), nullable=False, server_default="[]"),
        sa.Column("outcome_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("source_event_ids", JSONB(), nullable=False, server_default="[]"),
        sa.Column("event_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("semantic_processed_at", TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False),
    )
    op.create_index("ix_memory_episodes_covers_to", "memory_episodes", ["covers_to"])

    # --- memory_facts ---
    op.create_table(
        "memory_facts",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("is_anchor", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "source_episode_id",
            PGUUID(as_uuid=True),
            sa.ForeignKey("memory_episodes.id"),
            nullable=True,
        ),
        sa.Column(
            "superseded_by",
            PGUUID(as_uuid=True),
            sa.ForeignKey("memory_facts.id"),
            nullable=True,
        ),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    )
    op.create_index("ix_memory_facts_category_key", "memory_facts", ["category", "key"])
    # Partial unique index: at most one live fact per (category, key)
    op.create_index(
        "uix_memory_facts_category_key_current",
        "memory_facts",
        ["category", "key"],
        unique=True,
        postgresql_where=sa.text("superseded_by IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uix_memory_facts_category_key_current", table_name="memory_facts")
    op.drop_index("ix_memory_facts_category_key", table_name="memory_facts")
    op.drop_table("memory_facts")

    op.drop_index("ix_memory_episodes_covers_to", table_name="memory_episodes")
    op.drop_table("memory_episodes")

    op.drop_index("ix_message_events_memory_processed_at", table_name="message_events")
    op.drop_index("ix_message_events_is_anchor", table_name="message_events")
    op.drop_column("message_events", "memory_processed_at")
    op.drop_column("message_events", "anchor_reason")
    op.drop_column("message_events", "is_anchor")
    op.drop_column("message_events", "significance_tags")
    op.drop_column("message_events", "significance_score")
