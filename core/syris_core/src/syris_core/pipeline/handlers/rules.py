"""Fastpath handlers for rule management."""
import logging
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ...observability.audit import AuditWriter
from ...schemas.events import MessageEvent
from ...schemas.pipeline import RouteDecision
from ...storage.db import session_scope
from ...storage.models import RuleRow
from ...storage.repos.rules import RuleRepo
from ..executor import PipelineHandler
from ._util import _extract_identifier, _parse_identifier

logger = logging.getLogger(__name__)


async def _resolve_rule(
    repo: RuleRepo,
    event: MessageEvent,
) -> tuple[RuleRow | None, str | None]:
    """Return (row, None) on success or (None, error_string) on failure.

    Looks up identifier from event.content first, then event.structured.
    Handles name ambiguity by returning a descriptive error.
    """
    raw = _extract_identifier(event.content, "rule")
    if not raw:
        raw = str(event.structured.get("rule_id", ""))
    if not raw:
        return None, "rule identifier missing from request"

    uuid, name = _parse_identifier(raw)
    if uuid:
        row = await repo.get(uuid)
        if row is None:
            return None, f"Rule {uuid} not found"
        return row, None

    rows = await repo.find_by_name(name)
    if not rows:
        return None, f"No rule named '{name}' found"
    if len(rows) > 1:
        ids = ", ".join(str(r.rule_id) for r in rows)
        return None, f"Multiple rules named '{name}' — specify by UUID: {ids}"
    return rows[0], None


def make_rule_list_handler(
    session_maker: async_sessionmaker[AsyncSession],
) -> PipelineHandler:
    """Handler for rule.list: returns a summary of all rules."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            rows = await RuleRepo(session).list_all()
        if not rows:
            return "No rules configured."
        lines = [
            f"  {r.rule_id} '{r.name}' enabled={r.enabled} debounce={r.debounce_s}s"
            for r in rows
        ]
        return f"Rules ({len(rows)}):\n" + "\n".join(lines)

    return handler


def make_rule_enable_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for rule.enable: enables a rule by UUID or name."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            repo = RuleRepo(session)
            row, error = await _resolve_rule(repo, event)
            if error:
                return error
            await repo.update_fields(row.rule_id, enabled=True)

        await audit.emit(
            event.trace_id,
            stage="rule",
            type="rule.enabled",
            summary=f"Rule {row.rule_id} enabled",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(row.rule_id),
        )
        return f"Rule {row.rule_id} enabled"

    return handler


def make_rule_disable_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for rule.disable: disables a rule by UUID or name."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            repo = RuleRepo(session)
            row, error = await _resolve_rule(repo, event)
            if error:
                return error
            await repo.update_fields(row.rule_id, enabled=False)

        await audit.emit(
            event.trace_id,
            stage="rule",
            type="rule.disabled",
            summary=f"Rule {row.rule_id} disabled",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(row.rule_id),
        )
        return f"Rule {row.rule_id} disabled"

    return handler


def make_rule_create_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for rule.create: creates a rule from event.structured payload.

    Expected structured keys: name, conditions (list), action (dict).
    Optional: debounce_s (int).
    No fastpath route — invoked only via structured payload from other paths.
    """

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        s = event.structured
        name = s.get("name", f"rule-{event.event_id}")
        conditions = s.get("conditions", [])
        action = s.get("action", {})
        debounce_s = int(s.get("debounce_s", 0))

        row = RuleRow(
            rule_id=uuid4(),
            name=name,
            conditions=conditions,
            action=action,
            debounce_s=debounce_s,
        )
        async with session_scope(session_maker) as session:
            saved = await RuleRepo(session).create(row)
            rule_id = saved.rule_id

        await audit.emit(
            event.trace_id,
            stage="rule",
            type="rule.created",
            summary=f"Rule '{name}' ({rule_id}) created via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(rule_id),
        )
        return f"Created rule '{name}' id={rule_id}"

    return handler
