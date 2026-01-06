from pydantic import BaseModel, Field
from typing import Optional

class Subaction(BaseModel):
    id: str
    prompt_line: str
    keywords: Optional[list[str]]
    examples: Optional[list[str]] = None
    schema_id: str

class SubactionBias(BaseModel):
    on_imperative: float = 0.0
    on_interrogative: float = 0.0
    on_question_mark: float = 0.0
    on_imperative_beats_question: float = 0.0

class LaneConfig(BaseModel):
    subaction_bias: Optional[dict[str, SubactionBias]]

class Lane(BaseModel):
    id: str
    prompt_line: str
    keywords: Optional[list[str]] = None
    examples: Optional[list[str]] = None
    subactions: Optional[dict[str, Subaction]] = None
    config: Optional[LaneConfig] = None
