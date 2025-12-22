import json

from .resolve_time import resolve_run_at
from .assert_intent_type import assert_intent_type

def normalize_message_content(value):
    if isinstance(value, str):
        return value

    elif isinstance(value, (dict, list)):
        return json.dumps(value)

    return str(value)
