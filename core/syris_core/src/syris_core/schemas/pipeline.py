import enum
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


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


class AmbiguityDecision(str, enum.Enum):
    TOOL_CALL = "tool_call"
    AGENT = "agent"
    NOTIFY = "notify"
    DISCARD = "discard"
    ESCALATE = "escalate"


class LLMRoutingDecision(BaseModel):
    """Output of LLMambiguityRouter — a coarse routing decision for a non-chat event.

    namespace is populated ONLY for tool_call decisions; the model_validator
    enforces this for any construction path.
    """

    decision: AmbiguityDecision
    namespace: Optional[str] = None
    reason: str
    # TODO: replace self-reported confidence with deterministic scoring derived
    # from token-level log-probabilities once the provider surfaces them.
    confidence: float = 0.0

    model_config = {"frozen": True}

    @model_validator(mode="before")
    @classmethod
    def _coerce_namespace(cls, values: dict) -> dict:
        """Strip namespace for any non-tool_call decision."""
        decision_raw = values.get("decision")
        decision_val = (
            decision_raw.value
            if isinstance(decision_raw, AmbiguityDecision)
            else decision_raw
        )
        if decision_val != AmbiguityDecision.TOOL_CALL.value:
            values["namespace"] = None
        return values
