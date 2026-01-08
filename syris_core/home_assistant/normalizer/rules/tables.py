# Domain -> allowed ops (strings matching ControlOperation values)
ALLOWED_OPS: dict[str, set[str]] = {
    "light": {"power_on", "power_off", "power_toggle", "set_brightness", "set_color_temp"},
    "cover": {"open", "close", "set_position"},
    "climate": {"set_temperature"},
    "switch": {"power_on", "power_off", "power_toggle"},
    "media_player": {"power_on", "power_off", "power_toggle", "play", "pause", "stop", "mute", "unmute"},
    "lock": {"lock", "unlock"},
}

# Operation -> required data keys (only when that op needs extra fields)
REQUIRES_DATA_KEYS: dict[str, set[str]] = {
    "set_brightness": {"brightness"},
    "set_color_temp": {"color_temp"},          # or color_temp_kelvin depending on HA map
    "set_position": {"position"},
    "set_temperature": {"temperature"},
}

# Phrases -> preferred canonical operations
PHRASE_TO_OP: list[tuple[tuple[str, ...], str]] = [
    (("turn off", "switch off", "power off"), "power_off"),
    (("turn on", "switch on", "power on"), "power_on"),
    (("toggle",), "power_toggle"),
    (("open",), "open"),
    (("close", "shut"), "close"),
    (("dim", "dimmer", "lower"), "set_brightness"),
    (("brighten", "brighter", "raise", "increase"), "set_brightness"),
]
