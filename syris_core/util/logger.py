import os
import datetime
import threading
from typing import Literal

COLORS = {
    # Core System
    "core": "\033[96m",  # bright cyan — primary system identity
    "orchestrator": "\033[38;5;45m",  # teal/cyan — central execution engine
    "event_bus": "\033[38;5;33m",  # deep cyan-blue — event routing backbone
    # Intelligence layer
    "llm": "\033[95m",  # magenta — signals high-level reasoning
    "intent": "\033[38;5;135m",  # soft purple — intent interpretation
    "planning": "\033[38;5;171m",  # pastel purple — multi-step planning
    # Subsystem
    "tool": "\033[92m",  # green — actionable operations
    "memory": "\033[93m",  # yellow — storage/recall (semantic association)
    "audio": "\033[90m",  # grey — ASR/TTS, more passive/log-oriented
    # Event + Subscribers
    "event": "\033[94m",  # blue — external inputs into system
    "subscriber": "\033[38;5;208m",  # orange — reactive handlers for event types
    # Diagnostics
    "test": "\033[38;5;244m",  # light grey — neutral testing output
    # Errors / Warnings
    "error": "\033[91m",  # red — hard failures
    "warning": "\033[38;5;220m",  # bright yellow-orange — non-fatal issues
    # Reset
    "reset": "\033[0m",
}


LogSource = Literal[
    "core",
    "event",
    "llm",
    "tool",
    "memory",
    "audio",
    "error",
    "orchestrator",
    "subscriber",
    "rules",
    "scheduler",
    "control",
    "event_bus",
    "test",
    "ha"
]

# Internal rename mapping
SOURCE_DISPLAY_NAMES = {
    "core": "SYRIS",
    "event_bus": "EVENT BUS",
}

# Log folders
LOG_DIR = "data/logs"
os.makedirs(LOG_DIR, exist_ok=True)

# Thread lock so logs dont overlap
_write_lock = threading.Lock()


# Log function for clean centralised logging throughout system
def log(source: LogSource, message: str, level: str = "info", write_file=True):
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    color = COLORS.get(source, COLORS["reset"])
    reset = COLORS["reset"]

    display_source = SOURCE_DISPLAY_NAMES.get(source, source.upper())

    console_line = f"{color}[{timestamp}] [{display_source}] {message}{reset}"

    print(console_line)

    if write_file:
        file_line = f"[{timestamp}] [{level.upper()}] [{display_source}] {message}\n"
        file_path = os.path.join(LOG_DIR, "syris.log")

        with _write_lock:
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(file_line)


_lora_write_lock = threading.Lock()

def log_lora_data(message: str):
    file_line = message
    file_path = os.path.join(LOG_DIR, "lora_data.log")

    with _lora_write_lock:
        with open(file_path, "a", encoding="utf-8") as f: 
            f.write(file_line)