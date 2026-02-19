import socket
from .helpers import apply_metadata
from .types import Metadata

METADATA: Metadata = {
    "name": "get_ip_address",
    "description": "Returns the local machine's IP address, or 'Unknown' if it cannot be determined.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
    "output_schema": {
        "type": "string",
        "description": "IPv4 address string or 'Unknown'.",
    },
    "errors": ["socket.gaierror", "socket.error"],
    "examples": [{"call": "get_ip_address()", "result": "192.168.1.42"}],
}


def get_ip_address():
    try:
        return socket.gethostbyname(socket.gethostname())
    except:
        return "Unknown"


apply_metadata(get_ip_address, METADATA)
