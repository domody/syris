from typing import TypedDict, List, Dict, Any, NotRequired


class InputSchema(TypedDict, total=True):
    type: str
    properties: Dict[str, Any]
    required: List[str]


class OutputSchema(TypedDict, total=True):
    type: str
    description: str
    properties: NotRequired[Dict[str, Any] | None]
    items: NotRequired[Dict[str, Any] | None]


class Metadata(TypedDict, total=True):
    name: str
    description: str
    input_schema: InputSchema
    output_schema: OutputSchema
    errors: List[str]
    examples: List[Dict[str, Any]]
