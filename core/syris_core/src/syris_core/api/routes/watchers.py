import uuid

from fastapi import APIRouter, HTTPException, Request

from syris_core.observability.audit import AuditWriter
from syris_core.schemas.watchers import WatcherPatch, WatcherState
from syris_core.storage.db import session_scope
from syris_core.storage.models import WatcherStateRow
from syris_core.storage.repos.watchers import WatcherStateRepo

router = APIRouter(prefix="/watchers", tags=["watchers"])


def _row_to_schema(row: WatcherStateRow) -> WatcherState:
    return WatcherState(
        watcher_id=row.watcher_id,
        enabled=row.enabled,
        last_tick_at=row.last_tick_at,
        last_outcome=row.last_outcome,  # type: ignore[arg-type]
        dedupe_window=row.dedupe_window,
        consecutive_errors=row.consecutive_errors,
        suppression_count=row.suppression_count,
        updated_at=row.updated_at,
    )


@router.get("", response_model=list[WatcherState])
async def list_watchers(request: Request) -> list[WatcherState]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = WatcherStateRepo(session)
        rows = await repo.list_all()
    return [_row_to_schema(r) for r in rows]


@router.patch("/{watcher_id}", response_model=WatcherState)
async def patch_watcher(watcher_id: str, body: WatcherPatch, request: Request) -> WatcherState:
    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    async with session_scope(sessionmaker) as session:
        repo = WatcherStateRepo(session)
        updated = await repo.update_fields(watcher_id, enabled=body.enabled)

    if updated is None:
        raise HTTPException(status_code=404, detail="Watcher not found")

    await audit.emit(
        uuid.uuid4(),
        stage="watcher",
        type="watcher.updated",
        summary=f"Watcher {watcher_id} enabled={body.enabled}",
        outcome="success",
        connector_id=watcher_id,
    )

    return _row_to_schema(updated)
