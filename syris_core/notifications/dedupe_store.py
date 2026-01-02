import time
from dataclasses import dataclass, field
from typing import Any

@dataclass
class DedupeStore:
    _last: dict[str, float] = field(default_factory=dict)
    _suppressed: dict[str, int] = field(default_factory=dict)
    
    def should_suppress(self, key: str, cooldown_s:int) -> bool:
        if cooldown_s <= 0:
            self._last[key] = time.time()
            return False

        now = time.time()
        last = self._last.get(key)

        if last is not None and (now - last) < cooldown_s:
            self._suppressed[key] = self._suppressed.get(key, 0) + 1
            return True
        
        self._last[key] = now
        self._suppressed[key] = 0
        return False
    

    def suppressed_count(self, key: str) -> int:
        return self._suppressed.get(key, 0)

