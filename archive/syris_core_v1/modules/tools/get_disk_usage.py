import psutil
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_disk_usage",
    "description": "Returns disk usage statistics for the root filesystem.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
    "output_schema": {
        "type": "object",
        "properties": {
            "total": {"type": "number"},
            "used": {"type": "number"},
            "free": {"type": "number"},
            "percent": {"type": "number"},
        },
        "description": "Disk usage information in bytes and percentage usage.",
    },
    "errors": ["psutil.Error"],
    "examples": [
        {
            "call": "get_disk_usage()",
            "result": {
                "total": 500000000000,
                "used": 230000000000,
                "free": 270000000000,
                "percent": 46.0,
            },
        }
    ],
}


def get_disk_usage():
    disk = psutil.disk_usage("/")
    return {
        "total": disk.total,
        "used": disk.used,
        "free": disk.free,
        "percent": disk.percent,
    }


apply_metadata(get_disk_usage, METADATA)
