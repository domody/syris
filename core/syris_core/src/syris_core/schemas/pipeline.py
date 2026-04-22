import enum
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RouteDecision(BaseModel):
    """Output of the Router stage — identifies which handler should process the event."""

    event_id: UUID
    trace_id: UUID
    handler: str  # e.g. "unroutable", "llm_conversation", "timer.set"
    matched_rule_id: Optional[str] = None
    confidence: Optional[float] = None  # populated only by LLM fallback (future)
    reason: str
    routed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    model_config = {"frozen": True}


class ExecutionOutcome(str, enum.Enum):
    SUCCESS = "success"
    NOOP = "noop"
    FAILURE = "failure"
    SUPPRESSED = "suppressed"


class ExecutionResult(BaseModel):
    """Output of the Executor stage."""

    event_id: UUID
    trace_id: UUID
    handler: str
    outcome: ExecutionOutcome
    detail: str
    latency_ms: Optional[int] = None
    executed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    model_config = {"frozen": True}


class IngestResponse(BaseModel):
    """HTTP response for POST /ingest — execution result plus optional reply text."""

    execution: ExecutionResult
    reply: Optional[str] = None
    thinking: Optional[str] = None
