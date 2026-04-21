from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class Notification:
    title: str
    body: str
    metadata: Optional[dict[str, Any]] = None # handler, source, etc.


class NotificationChannel(ABC):
    @abstractmethod
    async def send(self, notification: Notification) -> None: ...