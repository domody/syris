import psutil
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_memory_usage",
    "description": "Returns statistics about system memory usage.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
    "output_schema": {
        "type": "object",
        "properties": {
            "total": {"type": "number"},
            "available": {"type": "number"},
            "used": {"type": "number"},
            "percent": {"type": "number"},
        },
        "description": "Memory usage information in bytes and percentage usage.",
    },
    "errors": ["psutil.AccessDenied"],
    "examples": [
        {
            "call": "get_memory_usage()",
            "result": {
                "total": 17179869184,
                "available": 8214568960,
                "used": 8965304320,
                "percent": 52.1,
            },
        }
    ],
}


def get_memory_usage():
    mem = psutil.virtual_memory()
    return {
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent,
    }


apply_metadata(get_memory_usage, METADATA)
