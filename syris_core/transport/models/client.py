from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field

from .enums import MsgType, ProtocolVersion, CommandMode, HistoryQueryBy, Codec
from .filters import StreamSubscription, TransportFilters, SubscribeOptions
from .ids import RequestId, StreamId


class C_Hello(BaseModel):
    t: Literal[MsgType.HELLO] = MsgType.HELLO
    protocol: int = Field(default=int(ProtocolVersion.V1))
    client: str = Field(default="unknown", max_length=64)
    cap: List[str] = Field(default_factory=list)  # e.g. ["events", "commands", "voice"]
    auth_token: Optional[str] = Field(default=None, max_length=2048)  # optional


class C_Subscribe(BaseModel):
    t: Literal[MsgType.SUBSCRIBE] = MsgType.SUBSCRIBE
    streams: List[StreamSubscription] = Field(default_factory=list)
    filters: TransportFilters = Field(default_factory=TransportFilters)
    options: SubscribeOptions = Field(default_factory=SubscribeOptions)


class C_Unsubscribe(BaseModel):
    t: Literal[MsgType.UNSUBSCRIBE] = MsgType.UNSUBSCRIBE
    stream_names: List[str] = Field(default_factory=list)


class C_SetFilter(BaseModel):
    t: Literal[MsgType.SET_FILTER] = MsgType.SET_FILTER
    filters: TransportFilters


class C_Command(BaseModel):
    t: Literal[MsgType.COMMAND] = MsgType.COMMAND
    request_id: Optional[RequestId] = None  # recommended to set; server can generate if omitted
    mode: CommandMode = CommandMode.CHAT

    # chat mode
    text: Optional[str] = Field(default=None, max_length=16_000)

    # control mode (example shape — you can expand later)
    action: Optional[str] = Field(default=None, max_length=128)  # e.g. "device.set"
    entity_id: Optional[str] = Field(default=None, max_length=256)
    args: Dict[str, Any] = Field(default_factory=dict)  # must be JSON-serializable

    # optional client context
    source: Optional[str] = Field(default="dashboard", max_length=64)


class C_HistoryGet(BaseModel):
    t: Literal[MsgType.HISTORY_GET] = MsgType.HISTORY_GET
    by: HistoryQueryBy = HistoryQueryBy.RECENT
    value: Optional[str] = Field(default=None, max_length=256)  # request_id/entity_id depending on `by`
    limit: int = Field(default=500, ge=0, le=10_000)

    # optional paging/cursors
    after_ts_ms: Optional[int] = Field(default=None, ge=0)
    before_ts_ms: Optional[int] = Field(default=None, ge=0)


class C_Ping(BaseModel):
    t: Literal[MsgType.PING] = MsgType.PING
    nonce: Optional[str] = Field(default=None, max_length=64)


# reserved for voice/tts later 

class C_VoiceStart(BaseModel):
    t: Literal[MsgType.VOICE_START] = MsgType.VOICE_START
    request_id: RequestId
    stream_id: StreamId = StreamId("mic1")
    codec: Codec = Codec.PCM_S16LE
    sample_rate: int = Field(default=16_000, ge=8000, le=48_000)
    channels: int = Field(default=1, ge=1, le=2)


class C_VoiceStop(BaseModel):
    t: Literal[MsgType.VOICE_STOP] = MsgType.VOICE_STOP
    request_id: RequestId
    stream_id: StreamId = StreamId("mic1")


class C_TTSStart(BaseModel):
    t: Literal[MsgType.TTS_START] = MsgType.TTS_START
    request_id: RequestId
    stream_id: StreamId = StreamId("tts1")
    codec: Codec = Codec.OPUS


class C_TTSStop(BaseModel):
    t: Literal[MsgType.TTS_STOP] = MsgType.TTS_STOP
    request_id: RequestId
    stream_id: StreamId = StreamId("tts1")
