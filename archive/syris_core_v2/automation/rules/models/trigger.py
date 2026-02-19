from typing import Optional, Literal
from pydantic import BaseModel, Field


class DeviceTrigger(BaseModel):
    kind: Literal["device_state_changed"] = "device_state_changed"

    entity_id: str

    from_state: Optional[str] = None
    to_state: Optional[str] = None

    require_state: bool = True
