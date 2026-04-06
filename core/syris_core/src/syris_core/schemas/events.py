from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class RawInput(BaseModel):
    """Pre-normalization inbound data. Whatever arrives at the system boundary."""

    source: str
    content: str | dict[str, Any]
    idempotency_key: Optional[str] = None
    trace_id: Optional[UUID] = None  # None → normalizer generates a new chain
    content_type: str = "text/plain"


class MessageEvent(BaseModel):
    """
    Canonical in-flight event representation.

    Every inbound signal becomes a MessageEvent before routing or execution.
    This is the single join key for all audit events in a pipeline chain.

    # TODO(milestone-N): persist MessageEvents for crash recovery and replay.
    """

    event_id: UUID = Field(default_factory=uuid4)
    trace_id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    source: str
    content: str
    structured: dict[str, Any] = Field(default_factory=dict)
    content_type: str = "text/plain"
    idempotency_key: Optional[str] = None
    parent_event_id: Optional[UUID] = None

    model_config = {"frozen": True}
