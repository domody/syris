"""Approval repository — data access only, no business logic."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ApprovalRow
from ...schemas.safety import Approval


class ApprovalRepo:
    """Thin data-access wrapper for the approvals table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, approval: Approval) -> ApprovalRow:
        """Persist a new Approval. Returns the inserted ORM row."""
        row = ApprovalRow(
            approval_id=approval.approval_id,
            created_at=approval.created_at,
            expires_at=approval.expires_at,
            status=approval.status,
            trace_id=approval.trace_id,
            ref_event_id=approval.ref_event_id,
            ref_task_id=approval.ref_task_id,
            ref_step_id=approval.ref_step_id,
            risk_level=approval.risk_level,
            autonomy_level=approval.autonomy_level,
            what=approval.what,
            why=approval.why,
            how_to_approve=approval.how_to_approve,
            decided_by=approval.decided_by,
            decided_at=approval.decided_at,
            decision_reason=approval.decision_reason,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, approval_id: uuid.UUID) -> Optional[ApprovalRow]:
        """Return an ApprovalRow by PK or None."""
        return await self._session.get(ApprovalRow, approval_id)

    async def list_pending(self) -> list[ApprovalRow]:
        """Return all pending approvals ordered by creation time."""
        stmt = (
            select(ApprovalRow)
            .where(ApprovalRow.status == "pending")
            .order_by(ApprovalRow.created_at)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self, limit: int = 100) -> list[ApprovalRow]:
        """Return recent approvals ordered by creation time descending."""
        stmt = (
            select(ApprovalRow)
            .order_by(ApprovalRow.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_approved_for_step(
        self, step_id: uuid.UUID
    ) -> Optional[ApprovalRow]:
        """Return the approved approval for a given step, if one exists."""
        stmt = (
            select(ApprovalRow)
            .where(ApprovalRow.ref_step_id == step_id)
            .where(ApprovalRow.status == "approved")
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def decide(
        self,
        approval_id: uuid.UUID,
        status: str,
        *,
        decided_by: str = "operator",
        decision_reason: Optional[str] = None,
    ) -> None:
        """Update an approval to approved or denied."""
        stmt = (
            update(ApprovalRow)
            .where(ApprovalRow.approval_id == approval_id)
            .values(
                status=status,
                decided_by=decided_by,
                decided_at=datetime.now(timezone.utc),
                decision_reason=decision_reason,
            )
        )
        await self._session.execute(stmt)
