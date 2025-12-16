import json


def normalize_message_content(value):
    if isinstance(value, str):
        return value

    elif isinstance(value, (dict, list)):
        return json.dumps(value)

    return str(value)
