import psutil
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_cpu_usage",
    "description": "Returns the current CPU usage percentage measured over a short sampling interval.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
    "output_schema": {
        "type": "number",
        "description": "CPU usage percentage as a float.",
    },
    "errors": ["psutil.AccessDenied", "psutil.NoSuchProcess"],
    "examples": [{"call": "get_cpu_usage()", "result": 37.4}],
}


def get_cpu_usage():
    return psutil.cpu_percent(interval=0.2)


apply_metadata(get_cpu_usage, METADATA)
