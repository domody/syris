from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SignificanceResult(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    tags: list[str]
    is_anchor: bool
    anchor_reason: Optional[str] = None

    model_config = {"frozen": True}


class EpisodeRecord(BaseModel):
    id: UUID
    covers_from: datetime
    covers_to: datetime
    content: str
    topics: list[str]
    tools_invoked: list[str]
    outcome_summary: str
    source_event_ids: list[str]
    event_count: int
    semantic_processed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"frozen": True}


class FactRecord(BaseModel):
    id: UUID
    category: str
    key: str
    value: str
    confidence: float = Field(ge=0.0, le=1.0)
    is_anchor: bool
    source_episode_id: Optional[UUID] = None
    superseded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"frozen": True}
