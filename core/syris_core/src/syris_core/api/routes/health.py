from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Request
from sqlalchemy import text

from syris_core.storage.db import session_scope

router = APIRouter(tags=["system"])

@router.get("/health")
async def health(request: Request) -> dict[str, Any]:
    app = request.app
    settings = getattr(app.state, "settings", None)

    now = datetime.now(timezone.utc)

    started_at = getattr(app.state, "started_at", None)
    run_id = getattr(app.state, "run_id", None)
    heartbeat = getattr(app.state, "heartbeat", None)
    sessionmaker = getattr(app.state, "sessionmaker", None)

    uptime_s = int((now - started_at).total_seconds()) if started_at else None
    last_heartbeat_at = heartbeat.snapshot().last_beat_at if heartbeat else None

    db_ok = False
    db_error: str | None = None
    if sessionmaker is None:
        db_error = "runtime_not_initialized (start via python -m syris_core.main)"
    else:
        try:
            async with session_scope(sessionmaker) as session:
                await session.execute(text("SELECT 1"))
            db_ok = True
        except Exception as e:
            db_error = str(e)

    status = "ok" if db_ok else "degraded"

    return {
        "status": status,
        "service": getattr(settings, "service_name", "syris-core") if settings else "syris-core",
        "version": getattr(settings, "version", "0.0.0") if settings else "0.0.0",
        "env": getattr(settings, "env", None) if settings else None,
        "run_id": str(run_id) if run_id else None,
        "started_at": started_at.isoformat() if started_at else None,
        "uptime_s": uptime_s,
        "db": {"ok": db_ok, "error": db_error},
        "last_heartbeat_at": last_heartbeat_at.isoformat() if last_heartbeat_at else None,
        "now": now.isoformat(),
    }