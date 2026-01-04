import time
import uuid
from typing import TYPE_CHECKING

from ..models.client import (
    C_Hello, C_Subscribe, C_Unsubscribe, C_SetFilter, C_Command, C_HistoryGet, C_Ping
)
from ..models.ids import RequestId
from ..models.server import S_Ack, S_HistoryResult
from ..models.enums import CommandMode, HistoryQueryBy
from ..models.requests import UserRequest  

if TYPE_CHECKING:
    from .session import Session

def now_ms() -> int:
    return int(time.time() * 1000)

def new_request_id() -> str:
    return f"req_{uuid.uuid4()}"

async def handle_message(msg, *, session: "Session") -> None:
    # HELLO is optional, but nice for protocol/version negotiation later
    if isinstance(msg, C_Hello):
        # you can store client caps, auth token, etc.
        return

    if isinstance(msg, C_Subscribe):
        session.subscriptions = msg.streams
        session.filters = msg.filters
        session.options = msg.options
        # optional: send recent history here if client asked
        return

    if isinstance(msg, C_Unsubscribe):
        # simplest: remove named streams
        session.subscriptions = [s for s in session.subscriptions if s.name not in set(msg.stream_names)]
        return

    if isinstance(msg, C_SetFilter):
        session.filters = msg.filters
        return

    if isinstance(msg, C_Ping):
        await session.send_pong(msg.nonce)
        return

    if isinstance(msg, C_HistoryGet):
        history = session.history
        if msg.by == HistoryQueryBy.RECENT:
            items = history.query_recent(limit=msg.limit)
        elif msg.by == HistoryQueryBy.REQUEST_ID and msg.value:
            items = history.query_request(msg.value, limit=msg.limit)
        elif msg.by == HistoryQueryBy.ENTITY_ID and msg.value:
            items = history.query_entity(msg.value, limit=msg.limit)
        else:
            items = []

        await session._try_enqueue(
            S_HistoryResult(by=msg.by.value, value=msg.value, items=items).model_dump()
        )
        return

    if isinstance(msg, C_Command):
        await _handle_command(msg, session=session)
        return

    await session.send_error("bad_request", "unsupported message type")


async def _handle_command(msg: C_Command, *, session: "Session") -> None:
    rid = str(msg.request_id) if msg.request_id else new_request_id()

    # claim ownership
    session.hub.claim_request(rid, session.session_id)
    
    # validate minimal requirements
    if msg.mode == CommandMode.CHAT:
        if not msg.text or not msg.text.strip():
            await session.send_error("bad_request", "chat requires non-empty text", request_id=rid)
            return
    else:
        if not msg.action:
            await session.send_error("bad_request", "non-chat requires action", request_id=rid)
            return

    # ACK immediately
    await session._try_enqueue(S_Ack(request_id=RequestId(rid), ok=True, message="queued").model_dump())

    # Convert -> core request
    req = UserRequest(
        request_id=rid,
        created_ts_ms=now_ms(),
        source="dashboard",
        user_id="dev",
        session_id=session.session_id,
        text=msg.text,
        action=msg.action,
        entity_id=msg.entity_id,
        args=msg.args,
    )

    await session.orchestrator.submit_request(req)


