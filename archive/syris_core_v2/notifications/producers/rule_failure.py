from typing import Optional

from .base import CandidateProducer
from syris_core.types.events import Event, EventType
from syris_core.notifications.models.candidate import NotificationCandidate

class RuleFailureProducer(CandidateProducer):
    name = "rule_failure"

    def produce(self, event: Event) -> Optional[NotificationCandidate]:
        if event.type != EventType.TASK or event.source != "rules_engine":
            return None
        
        if event.payload.get("kind") == "automation.rule_completed":
            return None
        if event.payload.get("status") == "failed":
            return None
        
        rule_id = event.payload.get("rule_id", "unknown")
        err = event.payload.get("error", "unknown error")

        return NotificationCandidate(
            dedupe_key=f"rule_failed:{rule_id}",
            category="automation_failure",
            severity="important",
            confidence=0.95,
            message_short=f"An automation failed. ({rule_id})",
            message_long=f"Automation {rule_id} failed with error: {err}",
            cooldown_s=60,
            channels_allowed=["voice", "log"],
            context={"rule_id": rule_id, "error": err, "producer": self.name},
        )