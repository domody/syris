from typing import Optional

from .base import CandidateProducer
from syris_core.types.events import Event, EventType
from syris_core.notifications.models.candidate import NotificationCandidate

class EntityUnavailableProducer(CandidateProducer):
    name = "entity_unavailable"

    def produce(self, event: Event) -> Optional[NotificationCandidate]:
        if event.type != EventType.DEVICE:
            return None
        
        new_state = event.payload.get("new_state")
        if new_state != "unavailable":
            return None
        
        entity_id = event.payload.get("entity_id", "unknown")
        name = event.payload.get("name", entity_id)

        return NotificationCandidate(
            dedupe_key=f"entity_unavailable:{entity_id}",
            category="device_unavailable",
            severity="info",
            confidence=0.9,
            message_short=f"{name} is unavailable.",
            message_long=f"Entity {entity_id} became unavailable.",
            cooldown_s=300,
            channels_allowed=["log", "queue"],
            context={"entity_id": entity_id, "name": name, "producer": self.name},
        )