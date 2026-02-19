import psutil

METADATA = {
    "name": "get_memory_usage",
    "description": "Returns memory usage totals and percentage.",
    "intent": {
        "keywords": ["memory", "ram", "usage", "available"],
        "examples": ["How much RAM is being used?", "Show memory usage."],
    },
}


def get_memory_usage():
    mem = psutil.virtual_memory()
    return {
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent,
    }
