from syris_core.util.logger import log


def log_input_event(event):
    log("subscriber", f"Input event logged: {event.payload.get('text')}")
