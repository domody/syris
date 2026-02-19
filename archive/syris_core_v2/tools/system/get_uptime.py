import psutil
import time

METADATA = {
    "name": "get_uptime",
    "description": "Returns system uptime as hours and minutes.",
    "intent": {
        "keywords": ["uptime", "boot time", "how long", "since boot"],
        "examples": ["How long has this machine been up?", "What's the uptime?"],
    },
}


def get_uptime():
    boot = psutil.boot_time()
    seconds = time.time() - boot
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours}h {minutes}m"
