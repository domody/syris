from pydantic import BaseModel, ConfigDict
from typing import Any


class MemorySnapshot(BaseModel):
    messages: list[dict[str, Any]]

    model_config = ConfigDict(frozen=True)
