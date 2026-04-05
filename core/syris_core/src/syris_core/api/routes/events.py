from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Request

from syris_core.storage.db import session_scope
from syris_core.storage.repos.events import EventRepo

router = APIRouter(tags=["pipeline"])


@router.get("/events")
async def list_events(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    trace_id: Optional[UUID] = None,
) -> list[dict[str, Any]]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = EventRepo(session)
        rows = await repo.list_events(limit=limit, offset=offset, trace_id=trace_id)
    return [
        {
            "event_id": str(r.event_id),
            "trace_id": str(r.trace_id),
            "created_at": r.created_at.isoformat(),
            "source": r.source,
            "content": r.content,
            "structured": r.structured,
            "content_type": r.content_type,
            "idempotency_key": r.idempotency_key,
        }
        for r in rows
    ]
