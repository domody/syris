import time
from dataclasses import dataclass, field    
from pydantic import BaseModel
from typing import List, Dict, Optional

from syris_core.notifications.models.candidate import NotificationCandidate

class QueuedItem(BaseModel):
    candidate: NotificationCandidate
    created_at: float
    expires_at: float
    count: int = 1

@dataclass
class NotificationQueue:
    max_items: int = 500
    _items: List[QueuedItem] = field(default_factory=list)
    _index: Dict[str, int] = field(default_factory=dict)

    def push(self, candidate: NotificationCandidate, ttl_s: int = 24 * 3600) -> None:
        now = time.time()
        self.prune(now=now)

        index = self._index.get(candidate.dedupe_key)
        if index is not None:
            item = self._items[index]
            item.count += 1
            item.expires_at = max(item.expires_at, now + ttl_s)
            return
        
        if len(self._items) > self.max_items:
            dropped = self._items.pop(0)
            self._index.pop(dropped.candidate.dedupe_key, None)

            self._reindex()
        
        item = QueuedItem(candidate=candidate, created_at=now, expires_at=now+ttl_s)
        self._items.append(item)
        self._index[candidate.dedupe_key] = len(self._items) - 1
        
    def drain(self, *, now: Optional[float] = None) -> List[QueuedItem]:
        now = now or time.time()
        self.prune(now=now)
        items = self._items
        self._items = []
        self._index = {}
        return items
    
    def prune(self, *, now: Optional[float] = None) -> None:
        now = now or time.time()
        if not self._items:
            return
        self._items = [i for i in self._items if i.expires_at > now]
        self._reindex()

    def snapshot(self) -> List[QueuedItem]:
        self.prune()
        return list(self._items)

    def _reindex(self) -> None:
        self._index = {item.candidate.dedupe_key: idx for idx, item in enumerate(self._items)}