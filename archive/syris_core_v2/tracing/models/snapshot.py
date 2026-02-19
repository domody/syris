from dataclasses import dataclass, field, asdict
from typing import Any, Optional
from pydantic import BaseModel

from syris_core.types.llm import Intent, BaseIntent, IntentType
from syris_core.tracing.collector.trace_collector import StepResult
TruthLevel = str  # "confirmed" | "sent" | "failed" | "partial" | "no_action"
StepStatus = str  # "issued" | "sent" | "failed" | "confirmed" | "unconfirmed" | "partial_confirmed"

@dataclass
class Confirmation:
    device_event_id: str
    entity_id: Optional[str] = None
    old_state: Optional[str] = None
    new_state: Optional[str] = None
    matched_via: str = "trace.link"
    device_source: Optional[str] = None
    timestamp: Optional[float] = None

class Execution(BaseModel):
    outcome: str
    truth_level: str
    steps: list[StepResult]
    observed: Optional[dict[str, Any]] = None


def default_intent() -> Intent:
    return Intent(BaseIntent(
        type=IntentType.UNKNOWN,
        confidence=0.0,
    ))

class AssistantContext(BaseModel):
    request_id: str
    trace_id: Optional[str] = None

    intent: Intent = field(default_factory=default_intent)

    integrations: dict[str, Any] = field(default_factory=dict)

    capabilities: dict[str, Any] = field(default_factory=dict)

    execution: Execution = field(
        default_factory=lambda: Execution(outcome="", truth_level="", steps=[])
    )

    policy: dict[str, Any] = field(default_factory=dict)

    # narration_hints: dict[str, Any] = field(default_factory=dict)