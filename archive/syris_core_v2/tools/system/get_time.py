import datetime

METADATA = {
    "name": "get_time",
    "description": "Returns the current local time as HH:MM:SS.",
    "intent": {
        "keywords": ["time", "current time", "what time"],
        "examples": ["What time is it?", "Tell me the current time."],
    },
}


def get_time():
    now = datetime.datetime.now()
    return now.strftime("%H:%M:%S")
