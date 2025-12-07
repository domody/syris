import datetime
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_date",
    "description": "Returns today's date in ISO format (YYYY-MM-DD).",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    },
    "output_schema": {
        "type": "string",
        "description": "Date string in ISO format."
    },
    "errors": [],
    "examples": [
        {
            "call": "get_date()",
            "result": "2025-12-02"
        }
    ]
}

def get_date():
    return datetime.date.today().isoformat()

apply_metadata(get_date, METADATA)