import asyncio
import time
from dataclasses import dataclass, field
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any, Literal
from collections import OrderedDict
from syris_core.types.events import Event, EventType
from syris_core.events.bus import EventBus
from syris_core.tracing.models.collector import TraceSummary, StepResult

@dataclass 
class TraceCollector:
    event_bus: EventBus
    ttl_s: int = 15 * 60
    max_requests: int = 200

    _events_by_id: Dict[str, Event] = field(default_factory=dict)
    _req_event_ids: Dict[str, List[str]] = field(default_factory=dict)

    _traces: OrderedDict[str, TraceSummary] = field(default_factory=OrderedDict)
    _steps: Dict[str, Dict[str, StepResult]] = field(default_factory=dict)

    _links_by_effect: Dict[str, dict] = field(default_factory=dict)

    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    
    _conditions: Dict[str, asyncio.Condition] = field(default_factory=dict)
    
    def start(self) -> None:
        for t in (EventType.INPUT, EventType.TOOL, EventType.DEVICE, EventType.SYSTEM, EventType.ERROR):
            self.event_bus.subscribe(t, self.register)

    async def register(self, event: Event) -> None:
        async with self._lock:
            if not event.event_id:
                return
            
            self._events_by_id[event.event_id] = event

            rid = getattr(event, "request_id", None)
            now = time.time()

            if rid: 
                trace = self._traces.get(rid)
                if trace is None:
                    trace = TraceSummary(
                        request_id=rid,
                        created_at=now,
                        updated_at=now,
                    )
                    self._traces[rid] = trace
                else:
                    trace.updated_at = now

                self._req_event_ids.setdefault(rid, []).append(event.event_id)

                self._apply_event_to_trace(trace=trace, event=event)

            if event.type == EventType.SYSTEM and event.payload.get("kind") == "trace.link":
                self._apply_link_event(event=event)

            self._prune_locked(now=now)

    def _apply_event_to_trace(self, *, trace: TraceSummary, event: Event) -> None:
        if not event.event_id:
            return

        if event.type == EventType.TOOL:
            kind = event.payload.get("kind")
            phase = event.payload.get("phase")

            step_id = event.parent_event_id if event.parent_event_id is not None else event.event_id
            steps = self._steps.setdefault(trace.request_id, {})

            step = steps.get(step_id)
            if step is None:
                step = StepResult(
                    step_id=step_id,
                    kind=kind,
                    started_at=event.timestamp or time.time(),
                )
                steps[step_id] = step

            if phase == "start":
                step.status = "started"
                step.started_at = event.timestamp
            elif phase == "success":
                step.status = "success"
                step.ended_at = event.timestamp
            elif phase == "failure":
                step.status = "failure"
                step.ended_at = event.timestamp
                err = event.payload.get("error") or {}
                step.error_type = err.get("type")
                step.error_message = err.get("message")
                step.retryable = err.get("retryable")

        elif event.type == EventType.ERROR:
            pass

        self._recompute_outcome(request_id=trace.request_id)

    def _apply_link_event(self, event: Event) -> None:
        payload = event.payload
        cause_id = payload.get("cause_event_id")
        effect_id = payload.get("effect_event_id")
        if not cause_id or not effect_id:
            return
        
        self._links_by_effect[effect_id] = payload

        rid = payload.get("request_id")
        if not rid:
            return
        
        steps = self._steps.get(rid, {})
        step = steps.get(cause_id)
        if not step:
            # create a placeholder if link arives before tool event
            step = StepResult(
                step_id=cause_id,
                kind=None,
                started_at=event.timestamp
            )
            steps[cause_id] = step

        step.verified_by_device_event = True
        step.verified_at = event.timestamp
        self._recompute_outcome(request_id=rid)

        # update trace's observed changes
        trace = self._traces.get(rid)
        if trace is None:
            return
        
        device_event = self._events_by_id.get(effect_id)
        if not device_event: 
            return
        
        # update observed changes
        observed = trace.observed

        # tally changed entities
        observed["changed_entities"] = observed.get("changed_entities", 0) + 1

        # domain counts
        domains = observed.setdefault("domains", {})
        if not isinstance(domains, dict):
            return
        
        device_domain = device_event.payload.get("domain") or "unknown"
        domains[device_domain] = domains.get(device_domain, 0) + 1


    def _recompute_outcome(self, *, request_id: str) -> None:
        trace = self._traces.get(request_id)
        if not trace:
            return

        steps_dict = self._steps.get(request_id, {})
        steps = list(steps_dict.values())
        trace.steps = steps

        if not steps:
            trace.outcome = "unknown"
            return
        
        any_fail = any(s.status == "failure" for s in steps)
        any_success = any(s.status == "success" for s in steps)
        all_success = all(s.status == "success" for s in steps)

        if any_fail and any_success:
            trace.outcome = "partial"
        elif any_fail:
            trace.outcome = "failure"
        elif all_success:
            trace.outcome = "success"
        else:
            trace.outcome = "unknown"

    def get_snapshot(self, request_id: str) -> Optional[TraceSummary]:
        # return trace
        return self._traces.get(request_id)

    def _prune_locked(self, *, now: float) -> None:
        ttl_cutoff = now - self.ttl_s
        expired = [rid for rid, tr in self._traces.items() if tr.updated_at <  ttl_cutoff]
        for rid in expired:
            self._drop_request(rid)

        while len(self._traces) > self.max_requests:
            rid, _ = self._traces.popitem(last=False)
            self._drop_request(rid)

    def _drop_request(self, request_id: str) -> None:
        self._traces.pop(request_id, None)
        self._steps.pop(request_id, None)

        event_ids = self._req_event_ids.pop(request_id, [])
        for eid in event_ids:
            self._events_by_id.pop(eid, None)

    def _cond(self, request_id: str) -> asyncio.Condition:
        cond = self._conditions.get(request_id)
        if cond is None:
            cond = asyncio.Condition()
            self._conditions[request_id] = cond
        return cond
    
    async def _notify(self, request_id: str) -> None:
        cond = self._cond(request_id)
        async with cond:
            cond.notify_all()

    async def wait_until(self, request_id, predicate, *, timeout_s: float) -> bool:
        loop = asyncio.get_running_loop()
        deadline = loop.time() + timeout_s
        cond = self._cond(request_id)

        while True:
            snap = self.get_snapshot(request_id)
            if snap and predicate(snap):
                return True
            
            remaining = deadline - loop.time()
            if remaining <= 0:
                return False
            
            try:
                async with cond:
                    await asyncio.wait_for(cond.wait(), timeout=remaining)
            except asyncio.TimeoutError:
                return False
            
    async def wait_verified(self, request_id: str, *, timeout_s: float = 0.8) -> bool:
        def pred(s: TraceSummary) -> bool:
            return any(
                step.status == "success" and step.verified_by_device_event
                for step in s.steps
            )
        return await self.wait_until(request_id, pred, timeout_s=timeout_s)

    async def wait_all_verified(self, request_id: str, *, timeout_s: float = 0.8) -> bool:
        def pred(s: TraceSummary) -> bool:
            successes = [st for st in s.steps if st.status == "success"]
            return bool(successes) and all(st.verified_by_device_event for st in successes)
        return await self.wait_until(request_id, pred, timeout_s=timeout_s)