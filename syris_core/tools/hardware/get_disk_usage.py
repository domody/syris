import psutil

METADATA = {
    "name": "get_disk_usage",
    "description": "Returns disk usage totals and percentage for the system drive.",
    "intent": {
        "keywords": ["disk", "storage", "drive", "space", "free space"],
        "examples": ["How much disk space is left?", "Show disk usage."],
    },
}


def get_disk_usage():
    disk = psutil.disk_usage("/")
    return {
        "total": disk.total,
        "used": disk.used,
        "free": disk.free,
        "percent": disk.percent,
    }
