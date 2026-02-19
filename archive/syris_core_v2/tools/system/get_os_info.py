import platform

METADATA = {
    "name": "get_os_info",
    "description": "Returns basic operating system information.",
    "intent": {
        "keywords": ["os", "operating system", "system info", "version"],
        "examples": ["What OS is this machine running?", "Show the OS version."],
    },
}


def get_os_info():
    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
    }
