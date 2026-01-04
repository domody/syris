import asyncio
import time
from typing import Dict, Optional, Tuple, TYPE_CHECKING

from ..models.events import TransportEvent
from ..models.enums import EventKind, Level
from .history import EventHistory

if TYPE_CHECKING:
    from .session import Session

def now_ms() -> int:
    return int(time.time() * 1000)

class Hub:
    def __init__(self, *, history: EventHistory):
        self._history = history
        self._sessions: Dict[str, "Session"] = {}
        self._lock = asyncio.Lock()

        self._request_owner: Dict[str, Tuple[str, int]] = {}
        self._request_owner_max = 10_000
        self._request_owner_ttl_ms = 30 * 60 * 1000  # 30 minutes

    def client_count(self) -> int:
        return len(self._sessions)

    async def register(self, session: "Session") -> None:
        async with self._lock:
            self._sessions[session.session_id] = session
        await session.send_welcome()

        await session.maybe_send_initial_history(self._history)

    async def unregister(self, session: "Session") -> None:
        async with self._lock:
            self._sessions.pop(session.session_id, None)

    async def close_all(self) -> None:
        async with self._lock:
            sessions = list(self._sessions.values())
            self._sessions.clear()
        for s in sessions:
            await s.close()

    async def publish(self, event: TransportEvent) -> None:
        async with self._lock:
            sessions = list(self._sessions.values())
        
        if self._is_private(event):
            owner_session_id = self.owner_of(event.request_id)
            if owner_session_id:
                s = self._sessions.get(owner_session_id)
                if s and self._matches(s, event):
                    await s.try_send_event(event)
                return
            
        for s in sessions:
            if self._matches(s, event):
                ok = await s.try_send_event(event=event)
                if not ok:
                    pass
    
    def claim_request(self, request_id: str, session_id: str) -> None:
        now = now_ms()
        self._request_owner[request_id] = (session_id, now)
        self._prune_request_owner(now)

    def owner_of(self, request_id: Optional[str]) -> Optional[str]:
        if not request_id:
            return None
        row = self._request_owner.get(request_id)
        if not row:
            return None
        session_id, ts = row
        now = now_ms()
        if now - ts > self._request_owner_ttl_ms:
            self._request_owner.pop(request_id, None)
            return None
        return session_id
    
    def _prune_request_owner(self, now_ms: int) -> None:
        expired = [rid for rid, (_, ts) in self._request_owner.items()
                    if now_ms - ts > self._request_owner_ttl_ms
        ]
        for rid in expired:
            self._request_owner.pop(rid, None)

        if len(self._request_owner) > self._request_owner_max:
            items = sorted(self._request_owner.items(), key= lambda kv: kv[1][1])
            for rid, _ in items[: len(self._request_owner) - self._request_owner_max]:
                self._request_owner.pop(rid, None) 

    def _is_private(self, event: TransportEvent) -> bool:
        if event.kind in (EventKind.INPUT, EventKind.NOTIFY, EventKind.ASSISTANT):
            return True
        
        return False

    def _matches(self, session: "Session", event: TransportEvent) -> bool:
        if session.subscriptions:
            allowed = False
            for sub in session.subscriptions:
                if sub.kinds and event.kind not in sub.kinds:
                    continue
                if sub.levels and event.level not in sub.levels:
                    continue
                allowed = True
                break

            if not allowed:
                return False

        f = session.filters
        if f is None:
            return True
        
        if f.kinds and event.kind not in f.kinds:
            return False
        if f.levels and event.level not in f.levels:
            return False
        if f.request_id and event.request_id != f.request_id:
            return False
        if f.entity_id and event.entity_id != f.entity_id:
            return False
        if f.entity_prefix and event.entity_id and not event.entity_id.startswith(f.entity_prefix):
            return False

        return True