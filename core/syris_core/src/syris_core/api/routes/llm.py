"""LLM debug routes."""
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request

from syris_core.llm.context import ContextBuilder
from syris_core.schemas.events import MessageEvent
from syris_core.storage.db import session_scope
from syris_core.storage.repos.events import EventRepo

router = APIRouter(tags=["llm"])


@router.get("/llm/context")
async def get_llm_context(
    request: Request,
    trace_id: UUID = Query(..., description="Trace ID to look up context for"),
) -> dict[str, Any]:
    """Debug endpoint: shows what context the LLM received (or would receive) for a given trace.

    First checks the in-memory cache of recently served contexts. If not
    cached, reconstructs the context from the stored event and thread history.
    """
    llm_client = request.app.state.llm_client
    context_builder: ContextBuilder = request.app.state.context_builder
    sessionmaker = request.app.state.sessionmaker

    # Check cache first
    cached = llm_client.get_cached_context(trace_id)
    if cached is not None:
        return _bundle_to_dict(cached)

    # Reconstruct from stored event
    async with session_scope(sessionmaker) as session:
        repo = EventRepo(session)
        rows = await repo.list_events(limit=1, trace_id=trace_id)

    if not rows:
        raise HTTPException(status_code=404, detail=f"No event found for trace_id={trace_id}")

    row = rows[0]
    event = MessageEvent(
        event_id=row.event_id,
        trace_id=row.trace_id,
        thread_id=row.thread_id,
        source=row.source,
        content=row.content,
        structured=row.structured,
        content_type=row.content_type,
        created_at=row.created_at,
        idempotency_key=row.idempotency_key,
        parent_event_id=row.parent_event_id,
    )

    bundle = await context_builder.build(event)
    return _bundle_to_dict(bundle)


def _bundle_to_dict(bundle: Any) -> dict[str, Any]:
    """Serialize a ContextBundle to a JSON-friendly dict."""
    return {
        "trace_id": str(bundle.trace_id),
        "thread_id": str(bundle.thread_id),
        "system_prompt": bundle.system_prompt,
        "conversation_history": [
            {
                "role": t.role,
                "content": t.content,
                "event_id": str(t.event_id),
                "created_at": t.created_at.isoformat(),
            }
            for t in bundle.conversation_history
        ],
        "current_user_message": bundle.current_user_message,
        "tool_catalog": bundle.tool_catalog,
        "recent_audit_events": bundle.recent_audit_events,
    }
