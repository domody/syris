"""Rules Engine — evaluates IFTTT-style rules against incoming MessageEvents.

Each enabled rule is checked against the event's fields. When all conditions
match, the engine fires the rule by:
  1. Checking quiet hours (if a policy is attached).
  2. Atomically claiming the fire slot via SELECT FOR UPDATE (debounce check).
  3. Creating a child MessageEvent that shares the parent's trace_id and carries
     parent_event_id, then persisting it and emitting audit events.

Suppressed firings (debounce or quiet hours) emit rule.suppressed audit events.
All exceptions bubble up to the caller (run_pipeline wraps in try/except).
"""
import logging
import re
import zoneinfo
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..storage.db import session_scope
from ..storage.repos.events import EventRepo
from ..storage.repos.rules import QuietHoursPolicyRepo, RuleRepo

logger = logging.getLogger(__name__)


def _resolve_field(event: MessageEvent, field: str) -> Any:
    """Resolve a dotted field path against a MessageEvent.

    Supported paths:
      "source"          → event.source
      "content"         → event.content
      "structured.KEY"  → event.structured.get("KEY")
      "structured.a.b"  → nested traversal with .get()

    Returns None for unknown top-level fields or missing nested keys.
    """
    if field == "source":
        return event.source
    if field == "content":
        return event.content
    if field.startswith("structured."):
        parts = field.split(".")[1:]
        current: Any = event.structured
        for part in parts:
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current
    return None


def _evaluate_condition(event: MessageEvent, cond: dict) -> bool:
    """Evaluate a single raw condition dict against an event.

    Operators:
      eq       — str(resolved) == str(value)
      contains — str(value) in str(resolved)
      matches  — re.search(value, str(resolved), re.I); invalid regex → False
      has_key  — field must start with "structured.", key present in structured

    Returns False for unknown ops, resolution errors, or None resolved values
    (fail-safe: a malformed condition never silently fires a rule).
    """
    op = cond.get("op")
    field = cond.get("field", "")
    value = cond.get("value")

    try:
        if op == "has_key":
            if not field.startswith("structured."):
                return False
            key = field.split(".", 1)[1]
            return key in event.structured

        resolved = _resolve_field(event, field)
        if resolved is None:
            return False

        if op == "eq":
            return str(resolved) == str(value)
        if op == "contains":
            return str(value) in str(resolved)
        if op == "matches":
            try:
                return bool(re.search(str(value), str(resolved), re.I))
            except re.error:
                return False
    except Exception:
        return False

    return False


def _is_quiet_hour(start_hour: int, end_hour: int, current_hour: int) -> bool:
    """Return True if current_hour falls in the [start_hour, end_hour) range.

    Handles overnight wrap-around (e.g. start=22, end=06).
    """
    if start_hour <= end_hour:
        return start_hour <= current_hour < end_hour
    # Overnight: e.g. 22 → 06 means quiet from 22:00 to 05:59
    return current_hour >= start_hour or current_hour < end_hour


class RulesEngine:
    """Evaluates all enabled rules against a MessageEvent.

    For each matching rule: checks quiet hours, then debounce, then fires
    (or suppresses) and emits audit events accordingly.
    """

    def __init__(
        self,
        session_maker: async_sessionmaker[AsyncSession],
        audit: AuditWriter,
    ) -> None:
        self._session_maker = session_maker
        self._audit = audit

    async def evaluate(self, event: MessageEvent) -> list[MessageEvent]:
        """Evaluate all enabled rules against event.

        Returns a list of child MessageEvents that were created (may be empty).
        Child events share the parent's trace_id and carry parent_event_id.
        """
        child_events: list[MessageEvent] = []

        async with session_scope(self._session_maker) as session:
            rule_repo = RuleRepo(session)
            event_repo = EventRepo(session)
            rules = await rule_repo.list_enabled()

            now = datetime.now(timezone.utc)

            for rule in rules:
                conditions: list[dict] = rule.conditions or []
                if not all(_evaluate_condition(event, c) for c in conditions):
                    continue

                suppressed = False

                # --- Quiet hours check ---
                if rule.quiet_hours_policy_id is not None:
                    policy = await QuietHoursPolicyRepo(session).get(
                        rule.quiet_hours_policy_id
                    )
                    if policy is not None:
                        try:
                            tz_name = policy.timezone
                            if tz_name.upper() in ("UTC", "UTC+0", "UTC-0"):
                                local_now = now
                            else:
                                tz = zoneinfo.ZoneInfo(tz_name)
                                local_now = now.astimezone(tz)
                            if _is_quiet_hour(
                                policy.start_hour, policy.end_hour, local_now.hour
                            ):
                                suppressed = True
                        except (zoneinfo.ZoneInfoNotFoundError, KeyError):
                            logger.warning(
                                "rules_engine.unknown_timezone rule_id=%s tz=%s",
                                rule.rule_id,
                                policy.timezone,
                            )

                # --- Debounce check (atomic SELECT FOR UPDATE) ---
                if not suppressed:
                    claimed = await rule_repo.claim_for_fire(rule.rule_id, now)
                    if claimed is None:
                        suppressed = True

                if suppressed:
                    await rule_repo.update_fields(
                        rule.rule_id,
                        suppression_count=rule.suppression_count + 1,
                    )
                    await self._audit.emit(
                        event.trace_id,
                        stage="rule",
                        type="rule.suppressed",
                        summary=(
                            f"Rule '{rule.name}' suppressed for event {event.event_id}"
                        ),
                        outcome="suppressed",
                        ref_event_id=event.event_id,
                        connector_id=str(rule.rule_id),
                    )
                    continue

                # --- Fire: create child event ---
                action: dict = rule.action or {}
                child = MessageEvent(
                    trace_id=event.trace_id,
                    source=action.get("source", "rules_engine"),
                    content=action.get("content", ""),
                    structured=action.get("structured", {}),
                    parent_event_id=event.event_id,
                )
                await event_repo.create(child)

                await self._audit.emit(
                    event.trace_id,
                    stage="rule",
                    type="rule.triggered",
                    summary=(
                        f"Rule '{rule.name}' triggered by event {event.event_id}, "
                        f"child={child.event_id}"
                    ),
                    outcome="success",
                    ref_event_id=event.event_id,
                    connector_id=str(rule.rule_id),
                )

                logger.info(
                    "rule.fired rule_id=%s event_id=%s child_event_id=%s",
                    rule.rule_id,
                    event.event_id,
                    child.event_id,
                )
                child_events.append(child)

        return child_events
