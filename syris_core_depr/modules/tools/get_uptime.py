import psutil
import time
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_uptime",
    "description": "Returns the system uptime formatted as 'Xh Ym'.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    },
    "output_schema": {
        "type": "string",
        "description": "Uptime formatted as hours and minutes."
    },
    "errors": [
        "psutil.Error"
    ],
    "examples": [
        {
            "call": "get_uptime()",
            "result": "5h 12m"
        }
    ]
}

def get_uptime():
    boot = psutil.boot_time()
    seconds = time.time() - boot
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours}h {minutes}m"

apply_metadata(get_uptime, METADATA)