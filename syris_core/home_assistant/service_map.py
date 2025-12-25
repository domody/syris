from syris_core.types.llm import ControlOperation

SERVICE_MAP: dict[str, dict[ControlOperation, str]] = {
    "light": {
        ControlOperation.POWER_ON: "turn_on",
        ControlOperation.POWER_OFF: "turn_off",
        ControlOperation.POWER_TOGGLE: "toggle",
        ControlOperation.SET_BRIGHTNESS: "turn_on",  # brightness is a parameter of turn_on
        ControlOperation.SET_COLOR_TEMP: "turn_on",  # color temp is a parameter of turn_on
    },
    "switch": {
        ControlOperation.POWER_ON: "turn_on",
        ControlOperation.POWER_OFF: "turn_off",
        ControlOperation.POWER_TOGGLE: "toggle",
    },
    "cover": {
        ControlOperation.OPEN: "open_cover",
        ControlOperation.CLOSE: "close_cover",
        ControlOperation.SET_POSITION: "set_cover_position",
    },
    "climate": {
        ControlOperation.SET_TEMPERATURE: "set_temperature",
    },
}


def map_operation(domain: str, op: ControlOperation) -> str:
    try:
        return SERVICE_MAP[domain][op]
    except KeyError:
        raise ValueError(f"No service mapping for {domain=} and {op=}")
