from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

AuditOutcome = Literal["success", "failure", "suppressed", "info"]

AuditStage = Literal[
    "normalize",
    "route",
    "execute",
    "tool_call",
    "gate",
    "operator",
    "scheduler",
    "watcher",
    "rule",
    "mcp",
    "task",
]
 
RiskLevel = Literal["low", "medium", "high", "critical"]
 
AutonomyLevel = Literal["A0", "A1", "A2", "A3", "A4"]

class AuditEvent(BaseModel):
    """
    Immutable record of a single pipeline action or state transition.

    audit_id and timestamp are populated by default_factory — they are
    set when the object is constructed inside AuditWriter.emit() and
    must not be passed by callers. trace_id is the sole join key that
    links every AuditEvent in a request chain back to the originating
    MessageEvent.
    """

    # Identity, set by AuditWriter
    audit_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Required Context
    trace_id: UUID
    stage: AuditStage
    type: str # e.g. "tool_call.succeeded", "event.ingested"
    summary: str # human-readable; indexed for search
    outcome: AuditOutcome

    # Optional cross-references — only set when the event relates to
    # an existing record in another table
    ref_event_id: Optional[UUID] = None
    ref_task_id: Optional[UUID] = None
    ref_step_id: Optional[UUID] = None
    ref_tool_call_id: Optional[UUID] = None
    ref_approval_id: Optional[UUID] = None

    # Optional observability metadata
    latency_ms: Optional[int] = None
    tool_name: Optional[str] = None
    connector_id: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    autonomy_level: Optional[AutonomyLevel] = None

    # payload_ref: artifact store ID for the redacted+encrypted payload blob.
    # NULL for events with no meaningful payload (e.g. event.ingested).
    # Full payload retrieval goes through GET /artifacts/{id}.
    payload_ref: Optional[str] = None
 
    model_config = {"frozen": True}  # AuditEvents are immutable after creation