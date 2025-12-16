import psutil
import time


def get_uptime():
    boot = psutil.boot_time()
    seconds = time.time() - boot
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours}h {minutes}m"
