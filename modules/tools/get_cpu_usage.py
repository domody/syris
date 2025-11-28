import psutil

def get_cpu_usage():
    return psutil.cpu_percent(interval=0.2)