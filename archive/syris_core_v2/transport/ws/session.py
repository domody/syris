import asyncio
import time
import uuid
from typing import Optional, List, TYPE_CHECKING

from fastapi import WebSocket

from ..models.ids import SessionId, RequestId
from ..models.filters import StreamSubscription, TransportFilters, SubscribeOptions
from ..models.server import S_Welcome, S_Event, S_Error, S_Dropped, S_Pong
from ..models.union import parse_client_message
from ..models.events import TransportEvent
from .router import handle_message

if TYPE_CHECKING:
    from .hub import Hub
    from .history import EventHistory
    from syris_core.core.orchestrator import Orchestrator

def now_ms() -> int:
    return int(time.time() * 1000)

class Session:
    def __init__(self, *, ws: WebSocket, hub: "Hub", history: "EventHistory", orchestrator: "Orchestrator"):
        self.ws = ws
        self.hub = hub
        self.orchestrator = orchestrator
        self.history = history
        
        self.session_id = f"s_{uuid.uuid4()}"

        self.subscriptions: List[StreamSubscription] = []
        self.filters: TransportFilters = TransportFilters()
        self.options: SubscribeOptions = SubscribeOptions()

        self._outbox: asyncio.Queue[dict] = asyncio.Queue(maxsize=1000)
        self._closed = False

        self._dropped_count = 0
        self._last_dropped_notify_ms = 0

    async def run(self) -> None:
        send_task = asyncio.create_task(self._send_loop(), name=f"{self.session_id}:send")
        recv_task = asyncio.create_task(self._recv_loop(), name=f"{self.session_id}:recv")

        done, pending = await asyncio.wait(
            [send_task, recv_task],
            return_when=asyncio.FIRST_EXCEPTION
        )

        for t in pending:
            t.cancel()

        for t in done:
            t.result()

    async def close(self) -> None:
        self._closed = True
        try: 
            await self.ws.close()
        except Exception as e:
            pass

    async def send_welcome(self) -> None:
        msg = S_Welcome(
            session_id=SessionId(self.session_id),
            server_ts_ms=now_ms(),
            cap=["events", "commands"],  # add "voice" later
        ).model_dump()
        await self._enqueue(msg)

    async def maybe_send_initial_history(self, history: EventHistory) -> None:
        if not self.options.include_recent:
            return
        items = history.query_recent(limit=self.options.recent_limit)
        for ev in items:
            await self._enqueue(S_Event(server_ts_ms=now_ms(), event=ev).model_dump())

    async def try_send_event(self, event: TransportEvent) -> bool:
        # Called by hub.publish() frequently; must be fast.
        payload = S_Event(server_ts_ms=now_ms(), event=event).model_dump()
        return await self._try_enqueue(payload)
    
    async def _recv_loop(self) -> None:
        while not self._closed:
            data = await self.ws.receive_json()
            msg = parse_client_message(data)
            await handle_message(msg, session=self)

    async def _send_loop(self) -> None:
        while not self._closed:
            item = await self._outbox.get()
            await self.ws.send_json(item)

    async def _enqueue(self, msg: dict) -> None:
        await self._outbox.put(msg)

    async def _try_enqueue(self, msg: dict) -> bool:
        try:
            self._outbox.put_nowait(msg)
            return True
        except asyncio.QueueFull:
            await self._on_drop()
            return False
        
    async def _on_drop(self) -> None:
        self._dropped_count += 1
        now = now_ms()

        if now - self._last_dropped_notify_ms > 1000:
            self._last_dropped_notify_ms = now
            await self._try_enqueue(
                S_Dropped(server_ts_ms=now_ms(), count=self._dropped_count, reason="client_slow").model_dump()
            )
            self._dropped_count = 0

    async def send_error(self, code: str, message: str, *, request_id: Optional[str] = None) -> None:
        await self._try_enqueue(S_Error(server_ts_ms=now_ms(), code=code, message=message, request_id=RequestId(request_id or "missing_request_id")).model_dump())

    async def send_pong(self, nonce: Optional[str]) -> None:
        await self._try_enqueue(S_Pong(server_ts_ms=now_ms(), nonce=nonce, server_time_ms=now_ms()).model_dump())