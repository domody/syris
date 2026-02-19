from dataclasses import dataclass
from typing import Literal, Optional
from datetime import datetime

from syris_core.notifications.models.candidate import NotificationCandidate

DecisionAction = Literal["speak", "log", "queue"]

@dataclass(frozen=True)
class NotificationDecision:
    action: DecisionAction
    reason: str

@dataclass
class NotificationPolicy:
    quiet_hours: tuple[int, int] | None = (23, 8)
    min_confidence_voice: float = 0.75
    speak_severities: tuple[str, ...] = ("important", "critical")

    def _fallback(self, candidate: NotificationCandidate, reason: str) -> NotificationDecision:
        if "queue" in candidate.channels_allowed:
            return NotificationDecision("queue", reason)
        return NotificationDecision("log", reason)

    def decide(self, candidate: NotificationCandidate, now: datetime) -> NotificationDecision:
        if "voice" in candidate.channels_allowed:
            if candidate.severity in self.speak_severities:
                if candidate.confidence >= self.min_confidence_voice:
                    if not (self._in_quiet_hours(now=now) and candidate.severity != "critical"):
                        return NotificationDecision("speak", "passed_policy")
                    # quiet hours blocks non-critical voice
                    return self._fallback(candidate=candidate, reason="quiet_hours")
                # low confidence blocks voice
                return self._fallback(candidate=candidate, reason="low_confidence")
            # severity not voice-worthy
            return self._fallback(candidate=candidate, reason="severity_not_voice")

        return self._fallback(candidate=candidate, reason="voice_not_allowed")

    def _in_quiet_hours(self, now: datetime) -> bool:
        if not self.quiet_hours:
            return False
        
        start_h, end_h = self.quiet_hours
        h = now.hour
        if start_h < end_h:
            return start_h <= h < end_h

        # wraps around midnight
        return (h >= start_h) or (h < end_h)