from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any, Literal

class StepResult(BaseModel):
    step_id: str    
    kind: Optional[str] = None
    status: Literal["started", "success", "failure"] = "started"

    started_at: float = 0.0
    ended_at: Optional[float] = None

    error_type: Optional[str] = None
    error_message: Optional[str] = None
    retryable: Optional[bool] = None

    verified_by_device_event: bool = False
    verified_at: Optional[float] = None

class TraceSummary(BaseModel):
    request_id: str 
    created_at: float
    updated_at: float

    intent_type: Optional[str] = None
    steps: List[StepResult] = Field(default_factory=list)
    observed: dict[str, Any] = Field(default_factory=dict)
    
    outcome: Literal["success", "failure", "partial", "unknown"] = "unknown"
    notes: list[str] = Field(default_factory=list)

