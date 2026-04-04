from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

WatcherOutcome = Literal["ok", "error", "suppressed"]


class WatcherState(BaseModel):
    """Persisted state for a single watcher instance."""

    watcher_id: str
    enabled: bool
    last_tick_at: Optional[datetime]
    last_outcome: Optional[WatcherOutcome]
    dedupe_window: dict[str, Any]
    consecutive_errors: int
    suppression_count: int
    updated_at: datetime


class WatcherPatch(BaseModel):
    """Request body for patching a watcher."""

    enabled: bool
