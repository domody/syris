import asyncio
import time
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, Optional

from syris_core.events.bus import EventBus
from syris_core.types.events import Event, EventType
from syris_core.util.logger import log

from .dedupe_store import DedupeStore
from .producers.base import CandidateProducer
from .producers.entity_unavailable import EntityUnavailableProducer
from .producers.rule_failure import RuleFailureProducer
from .policy import NotificationPolicy
from .queue import NotificationQueue

@dataclass
class NotifierAgent:
    event_bus: EventBus
    max_concurrencey: int = 8

    _sem: asyncio.Semaphore = field(init=False)
    _dedupe: DedupeStore = field(default_factory=DedupeStore)
    _policy: NotificationPolicy = field(default_factory=NotificationPolicy)
    _queue: NotificationQueue = field(default_factory=NotificationQueue)

    def __post_init__(self):
        self._sem = asyncio.Semaphore(self.max_concurrencey)
        self._producers: list[CandidateProducer] = [
            RuleFailureProducer(),
            EntityUnavailableProducer()
        ]

    def start(self):
        def on_task(e: Event): asyncio.create_task(self._handle(e))
        def on_device(e: Event): asyncio.create_task(self._handle(e))
        def on_schedule(e: Event): asyncio.create_task(self._handle(e))

        self.event_bus.subscribe(EventType.TASK, on_task)
        self.event_bus.subscribe(EventType.DEVICE, on_device)
        self.event_bus.subscribe(EventType.SCHEDULE, on_schedule)

        log("notifier", "NotifierAgent subscribed to TASK/DEVICE/SCHEDULE")

    async def _handle(self, event: Event) -> None:
        async with self._sem:
            now = datetime.now()

            candidate = None
            for p in self._producers:
                candidate = p.produce(event=event)
                if candidate:
                    break
            if not candidate:
                return
            
            log("notifier", f"[CANDIDATE] {candidate.model_dump_json()}")

            decision = self._policy.decide(candidate=candidate, now=now)
            log("notifier", f"[DECISION] {candidate.dedupe_key} -> {decision.action} ({decision.reason})")

            if decision.action == "speak":
                if self._dedupe.should_suppress(candidate.dedupe_key, candidate.cooldown_s):
                    log("notifier", f"[SUPPRESSED] {candidate.dedupe_key} x{self._dedupe.suppressed_count(candidate.dedupe_key)}")
                    return
                
                await self.event_bus.publish(Event(
                    type=EventType.NOTIFY,
                    source="notifier",
                    payload={
                        "message_short": candidate.message_short,
                        "severity": candidate.severity,
                        "dedupe_key": candidate.dedupe_key,
                        "category": candidate.category,
                    },
                    timestamp=time.time()
                ))

            if decision.action == "queue":
                self._queue.push(
                    candidate=candidate
                )
            