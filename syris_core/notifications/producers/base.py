from typing import Optional, Protocol

from syris_core.types.events import Event
from syris_core.notifications.models.candidate import NotificationCandidate

class CandidateProducer(Protocol):
    name: str
    def produce(self, event: Event) -> Optional[NotificationCandidate]: ...
