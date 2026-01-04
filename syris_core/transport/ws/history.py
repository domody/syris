from collections import deque, defaultdict
from typing import Deque, Dict, List, Optional

from ..models.events import TransportEvent

class EventHistory:
    def __init__(self, *, max_events: int = 10_000, per_index_limit: int = 2_000) -> None:
        self._events: Deque[TransportEvent] = deque(maxlen=max_events)
        self._by_request: Dict[str, Deque[TransportEvent]] = defaultdict(lambda: deque(maxlen=per_index_limit))
        self._by_entity: Dict[str, Deque[TransportEvent]] = defaultdict(lambda: deque(maxlen=per_index_limit))
        self._by_trace: Dict[str, Deque[TransportEvent]] = defaultdict(lambda: deque(maxlen=per_index_limit))

    def size(self) -> int:
        return len(self._events)

    def add(self, event: TransportEvent) -> None:
        self._events.append(event)
        if event.request_id:
            self._by_request[event.request_id].append(event)
        if event.entity_id:
            self._by_entity[event.entity_id].append(event)
        if event.trace_id:
            self._by_trace[event.trace_id].append(event)

    def query_recent(self, *, limit: int = 200) -> List[TransportEvent]:
        if limit <= 0:
            return []
        return list(self._events)[-limit:]
    
    def query_request(self, request_id: str, *, limit: int = 500) -> List[TransportEvent]:
        items = self._by_request.get(request_id)
        if not items:
            return []
        return list(items)[-limit:]

    def query_entity(self, entity_id: str, *, limit: int = 500) -> List[TransportEvent]:
        items = self._by_entity.get(entity_id)
        if not items:
            return []
        return list(items)[-limit:]