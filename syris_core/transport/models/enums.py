from enum import Enum

class ProtocolVersion(int, Enum):
    V1 = 1

class MsgType(str, Enum):
    # client to server
    HELLO = "hello"
    SUBSCRIBE = "subscrive"
    UNSUBSCRIBE = "unsubscribe"
    SET_FILTER = "set_filter"
    COMMAND = "command"
    HISTORY_GET = "history.get"
    PING = "ping"

    # voice
    VOICE_START = "voice.start"
    VOICE_STOP = "voice.stop"
    TTS_START = "tts.start"
    TTS_STOP = "tts.stop"

    # server to client
    WELCOME = "welcome"
    EVENT = "event"
    HISTORY_RESULT = "history.result"
    ERROR = "error"
    DROPPED = "dropped"
    PONG = "pong"
    ACK = "ack"

class EventKind(str, Enum):
    LOG = "log"
    TOOL = "tool"
    DEVICE = "device"
    TRACE = "trace"
    INTEGRATION = "integration"
    ASSISTANT = "assistant"
    SCHEDULE = "schedule"
    SYSTEM = "system"
    INPUT = "input"
    NOTIFY = "notify"

class Level(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARN = "warn"
    ERROR = "error"

class HistoryQueryBy(str, Enum):
    RECENT = "recent"
    REQUEST_ID = "request_id"
    ENTITY_ID = "entity_id"

class CommandMode(str, Enum):
    CHAT = "chat"
    CONTROL = "control"
    SCHEDULE = "schedule"

class Codec(str, Enum):
    PCM_S16LE = "pcm_s16le"
    OPUS = "opus"
    