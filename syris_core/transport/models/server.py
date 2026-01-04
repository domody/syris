from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

from .enums import MsgType, ProtocolVersion
from .events import TransportEvent
from .ids import SessionId, RequestId


class S_Welcome(BaseModel):
    t: Literal[MsgType.WELCOME] = MsgType.WELCOME
    server_ts_ms: int
    protocol: int = Field(default=int(ProtocolVersion.V1))
    session_id: SessionId
    cap: List[str] = Field(default_factory=list)  # capabilities server supports


class S_Event(BaseModel):
    t: Literal[MsgType.EVENT] = MsgType.EVENT
    server_ts_ms: int
    event: TransportEvent


class S_HistoryResult(BaseModel):
    t: Literal[MsgType.HISTORY_RESULT] = MsgType.HISTORY_RESULT
    server_ts_ms: int
    by: str
    value: Optional[str] = None
    items: List[TransportEvent] = Field(default_factory=list)


class S_Error(BaseModel):
    t: Literal[MsgType.ERROR] = MsgType.ERROR
    server_ts_ms: int
    code: str = Field(max_length=64)      # e.g. "bad_request", "unauthorized"
    message: str = Field(max_length=2048)
    request_id: Optional[RequestId] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class S_Dropped(BaseModel):
    t: Literal[MsgType.DROPPED] = MsgType.DROPPED
    server_ts_ms: int
    count: int = Field(ge=1)
    reason: str = Field(max_length=128)  # e.g. "client_slow"
    stream: Optional[str] = Field(default=None, max_length=64)


class S_Pong(BaseModel):
    t: Literal[MsgType.PONG] = MsgType.PONG
    server_ts_ms: int
    nonce: Optional[str] = Field(default=None, max_length=64)
    server_time_ms: int = Field(ge=0)


class S_Ack(BaseModel):
    t: Literal[MsgType.ACK] = MsgType.ACK
    server_ts_ms: int
    request_id: Optional[RequestId] = None
    ok: bool = True
    message: Optional[str] = Field(default=None, max_length=256)
