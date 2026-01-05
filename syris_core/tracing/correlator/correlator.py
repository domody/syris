import time
import asyncio
from dataclasses import dataclass, field
from typing import Optional, Dict, List
from pydantic import BaseModel

from syris_core.events.bus import EventBus
from syris_core.types.events import Event, EventType
from syris_core.util.logger import log

class PendingAction(BaseModel):
    entity_id: str
    trace_id: Optional[str]
    request_id: Optional[str]
    cause_event_id: Optional[str]

    issued_at: float
    expires_at: float

    # Optional constraints to reduce false matches
    expected_to_state: Optional[str] = None
    expected_from_state: Optional[str] = None

class CorrelationHit(BaseModel):
    trace_id: Optional[str]
    request_id: Optional[str]
    cause_event_id: Optional[str]
    matched_on: str  # entity_id

@dataclass
class PendingActionCorrelator:
    event_bus: EventBus

    ttl_s: float = 6.0
    _by_entity: Dict[str, List[PendingAction]] = field(default_factory=dict)

    def start(self):
        # def on_device(e: Event): asyncio.create_task(self._handle_device(e))
        # def on_tool(e: Event): asyncio.create_task(self._handle_tool(e))

        self.event_bus.subscribe(EventType.DEVICE, self._handle_device)
        self.event_bus.subscribe(EventType.TOOL, self._handle_tool)

    async def _handle_tool(self, event: Event):
        if event.payload.get("kind") != "ha.call_service":
            return

        if event.payload.get("phase") != "start":
            return
        
        entity_ids = event.payload.get("entity_ids") or []
        expected = event.payload.get("expected") or {}

        for eid in entity_ids:
            exp = expected.get(eid, {})

            self.register(
                entity_ids=[eid],
                trace_id=event.trace_id,
                request_id=event.request_id,
                cause_event_id=event.event_id,
                expected_from_state=exp.get("from_state"),
                expected_to_state=exp.get("to_state"),
            )

    async def _handle_device(self, event: Event):
        entity_id = event.payload.get("entity_id")
        if not entity_id:
            return

        hit = self.correlate_device_change(
            entity_id=entity_id,
            old_state=event.payload.get("old_state"),
            new_state=event.payload.get("new_state"),
        )

        if not hit:
            return
        
        await self.event_bus.publish(Event(
            type=EventType.SYSTEM,
            source="pending_action_correlator",
            payload={
                "kind": "trace.link",
                "cause_event_id": hit.cause_event_id,
                "effect_event_id": event.event_id,
                "trace_id": hit.trace_id,
                "request_id": hit.request_id,
                "matched_on": {"entity_id": hit.matched_on},
            },
            timestamp=time.time(),
        ))

    def register(
        self,
        *,
        entity_ids: List[str],
        trace_id: Optional[str],
        request_id: Optional[str],
        cause_event_id: Optional[str] = None,
        expected_to_state: Optional[str] = None,
        expected_from_state: Optional[str] = None,
        ttl_s: Optional[float] = None,
    ) -> None:
        now = time.time()
        ttl = self.ttl_s if ttl_s is None else ttl_s
        exp = now + ttl

        for eid in entity_ids:
            pa = PendingAction(
                entity_id=eid,
                trace_id=trace_id,
                request_id=request_id,
                cause_event_id=cause_event_id,
                issued_at=now,
                expires_at=exp,
                expected_to_state=expected_to_state,
                expected_from_state=expected_from_state,
            )
            self._by_entity.setdefault(eid, []).append(pa)

        self.prune(now=now)

    def correlate_device_change(
        self,
        *,
        entity_id: str,
        old_state: Optional[str],
        new_state: Optional[str],
    ) -> Optional[CorrelationHit]:
        now = time.time()
        actions = self._by_entity.get(entity_id)
        if not actions:
            return None

        # prune expired for this entity
        actions = [a for a in actions if a.expires_at > now]
        if not actions:
            self._by_entity.pop(entity_id, None)
            return None

        actions.sort(key=lambda a: a.issued_at, reverse=True)

        for i, a in enumerate(actions):
            if a.expected_from_state is not None and old_state is not None:
                if old_state != a.expected_from_state:
                    continue
            if a.expected_to_state is not None and new_state is not None:
                if new_state != a.expected_to_state:
                    continue

            # consume
            actions.pop(i)
            if actions:
                self._by_entity[entity_id] = actions
            else:
                self._by_entity.pop(entity_id, None)

            return CorrelationHit(
                trace_id=a.trace_id,
                request_id=a.request_id,
                cause_event_id=a.cause_event_id,
                matched_on=entity_id,
            )

        self._by_entity[entity_id] = actions
        return None

    def prune(self, *, now: Optional[float] = None) -> None:
        now = time.time() if now is None else now
        to_del = []
        for eid, lst in self._by_entity.items():
            lst2 = [a for a in lst if a.expires_at > now]
            if lst2:
                self._by_entity[eid] = lst2
            else:
                to_del.append(eid)
        for eid in to_del:
            self._by_entity.pop(eid, None)