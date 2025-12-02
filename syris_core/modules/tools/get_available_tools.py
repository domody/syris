from . import TOOL_MAP
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_available_tools",
    "description": (
        "Returns a dictionary mapping each registered tool name to its metadata, "
        "including description, input schema, output schema, errors, and examples."
    ),
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    },
    "output_schema": {
        "type": "object",
        "properties": {
            "type": "object"
        },
        "description": "Dictionary mapping tool names to their associated metadata."
    },
    "errors": [],
    "examples": [
        {
            "call": "get_available_tools()",
            "result": {
                "get_cpu_usage": {
                    "description": "Returns the current CPU usage percentage.",
                    "input_schema": {...},
                    "output_schema": {...},
                    "errors": [...],
                    "examples": [...]
                },
                "get_memory_usage": {
                    "...": "..."
                }
            }
        }
    ]
}

def get_available_tools():
    tools_metadata = {}

    for name, entry in TOOL_MAP.items():
        meta = entry.get("metadata")

        if meta is None:
            meta = {
                "name": name,
                "description": "No metadata available.",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                },
                "output_schema": {
                    "type": "object",
                    "description": "Unknown result structure."
                },
                "errors": [],
                "examples": []
            }

        tools_metadata[name] = meta

    return tools_metadata


apply_metadata(get_available_tools, METADATA)