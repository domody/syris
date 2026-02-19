from typing import Annotated, Union
from pydantic import Field, TypeAdapter

from .client import (
    C_Hello, C_Subscribe, C_Unsubscribe, C_SetFilter, C_Command, C_HistoryGet, C_Ping,
    C_VoiceStart, C_VoiceStop, C_TTSStart, C_TTSStop
)
from .server import (
    S_Welcome, S_Event, S_HistoryResult, S_Error, S_Dropped, S_Pong, S_Ack
)

ClientMessage = Annotated[
    Union[
        C_Hello, C_Subscribe, C_Unsubscribe, C_SetFilter, C_Command, C_HistoryGet, C_Ping,
        C_VoiceStart, C_VoiceStop, C_TTSStart, C_TTSStop
    ],
    Field(discriminator="t")
]

ServerMessage = Annotated[
    Union[S_Welcome, S_Event, S_HistoryResult, S_Error, S_Dropped, S_Pong, S_Ack],
    Field(discriminator="t")
]

client_adapter = TypeAdapter(ClientMessage)
server_adapter = TypeAdapter(ServerMessage)


def parse_client_message(data: dict) -> ClientMessage:
    return client_adapter.validate_python(data)
