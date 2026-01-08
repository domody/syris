from typing import Any

from pydantic import BaseModel, Field


class ToolArgs(BaseModel):
    arguments: dict[str, Any] = Field(
        default_factory=dict,
        description="Arguments to pass to the selected tool function.",
    )
