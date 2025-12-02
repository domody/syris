import platform
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_os_info",
    "description": "Returns basic information about the operating system.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    },
    "output_schema": {
        "type": "object",
        "properties": {
            "system": {"type": "string"},
            "release": {"type": "string"},
            "version": {"type": "string"}
        },
        "description": "Operating system type and version information."
    },
    "errors": [],
    "examples": [
        {
            "call": "get_os_info()",
            "result": {
                "system": "Windows",
                "release": "11",
                "version": "10.0.22631"
            }
        }
    ]
}


def get_os_info():
    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version()
    }

apply_metadata(get_os_info, METADATA)