import datetime

METADATA = {
    "name": "get_date",
    "description": "Returns the current local date as YYYY-MM-DD.",
    "intent": {
        "keywords": ["date", "current date", "today", "what date"],
        "examples": ["What's the date today?", "Tell me today's date."],
    },
}


def get_date():
    return datetime.date.today().isoformat()
