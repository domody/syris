"""Fastpath handlers for approval management."""
import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ...observability.audit import AuditWriter
from ...schemas.events import MessageEvent
from ...schemas.pipeline import RouteDecision
from ...storage.db import session_scope
from ...storage.repos.approvals import ApprovalRepo
from ..executor import PipelineHandler
from ._util import _extract_uuid

logger = logging.getLogger(__name__)


def make_approval_list_handler(
    session_maker: async_sessionmaker[AsyncSession],
) -> PipelineHandler:
    """Handler for approval.list: lists all pending approvals."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            rows = await ApprovalRepo(session).list_pending()
        if not rows:
            return "No pending approvals."
        lines = [f"  {r.approval_id}" for r in rows]
        return f"Pending approvals ({len(rows)}):\n" + "\n".join(lines)

    return handler


def make_approval_approve_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for approval.approve: approves a pending approval by UUID."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        approval_id = _extract_uuid(event.content) or event.structured.get("approval_id")
        if approval_id is None:
            return "approval_id missing from request"

        async with session_scope(session_maker) as session:
            await ApprovalRepo(session).decide(
                approval_id,
                "approved",
                decision_reason="Approved via pipeline",
            )

        await audit.emit(
            event.trace_id,
            stage="approval",
            type="approval.approved",
            summary=f"Approval {approval_id} approved via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(approval_id),
        )
        return f"Approved {approval_id}"

    return handler


def make_approval_deny_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for approval.deny: denies a pending approval by UUID."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        approval_id = _extract_uuid(event.content) or event.structured.get("approval_id")
        if approval_id is None:
            return "approval_id missing from request"

        async with session_scope(session_maker) as session:
            await ApprovalRepo(session).decide(
                approval_id,
                "denied",
                decision_reason="Denied via pipeline",
            )

        await audit.emit(
            event.trace_id,
            stage="approval",
            type="approval.denied",
            summary=f"Approval {approval_id} denied via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(approval_id),
        )
        return f"Denied {approval_id}"

    return handler
