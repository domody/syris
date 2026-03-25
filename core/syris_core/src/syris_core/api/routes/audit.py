from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query, Request
from sqlalchemy import select, desc

from syris_core.schemas.audit import AuditEvent
from syris_core.storage.db import session_scope
from syris_core.storage.models import AuditEventRow

router = APIRouter(tags=["system"])


@router.get("/audit")
async def list_audit_events(
    request: Request,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    trace_id: Optional[UUID] = Query(default=None),
) -> list[AuditEvent]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        stmt = (
            select(AuditEventRow)
            .order_by(desc(AuditEventRow.timestamp)) # type: ignore
            .offset(offset)
            .limit(limit)
        )
        if trace_id is not None:
            stmt = stmt.where(AuditEventRow.trace_id == trace_id) # type: ignore
        rows = (await session.execute(stmt)).scalars().all()

    return [AuditEvent(**row.model_dump()) for row in rows]
