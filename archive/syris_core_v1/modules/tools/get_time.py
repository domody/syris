import datetime
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_time",
    "description": "Returns the current local time in HH:MM:SS format.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
    "output_schema": {
        "type": "string",
        "description": "Current time string formatted as HH:MM:SS.",
    },
    "errors": [],
    "examples": [{"call": "get_time()", "result": "14:23:10"}],
}


def get_time():
    now = datetime.datetime.now()
    return now.strftime("%H:%M:%S")


apply_metadata(get_time, METADATA)
