import psutil

METADATA = {
    "name": "get_cpu_usage",
    "description": "Returns current CPU usage percentage.",
    "intent": {
        "keywords": ["cpu", "processor", "usage", "load"],
        "examples": ["What's the CPU usage?", "Show current processor load."],
    },
}


def get_cpu_usage():
    return psutil.cpu_percent(interval=0.2)
