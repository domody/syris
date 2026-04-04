import uuid
from datetime import timezone
from typing import Any

from croniter import croniter
from fastapi import APIRouter, HTTPException, Request

from syris_core.observability.audit import AuditWriter
from syris_core.schemas.schedules import Schedule, ScheduleCreate, SchedulePatch
from syris_core.storage.db import session_scope
from syris_core.storage.models import ScheduleRow
from syris_core.storage.repos.schedules import ScheduleRepo

router = APIRouter(prefix="/schedules", tags=["schedules"])


def _row_to_schema(row: ScheduleRow) -> Schedule:
    return Schedule(
        schedule_id=row.schedule_id,
        name=row.name,
        enabled=row.enabled,
        schedule_type=row.schedule_type,  # type: ignore[arg-type]
        cron_expr=row.cron_expr,
        interval_s=row.interval_s,
        run_at=row.run_at,
        timezone=row.timezone,
        quiet_hours_start=row.quiet_hours_start,
        quiet_hours_end=row.quiet_hours_end,
        catch_up_policy=row.catch_up_policy,  # type: ignore[arg-type]
        catch_up_max=row.catch_up_max,
        event_source=row.event_source,
        event_content=row.event_content,
        event_structured=row.event_structured,
        next_run_at=row.next_run_at,
        last_run_at=row.last_run_at,
        fire_count=row.fire_count,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _compute_initial_next_run(body: ScheduleCreate) -> Any:
    from datetime import datetime, timezone as tz

    now = datetime.now(tz.utc)
    if body.schedule_type == "cron":
        if not body.cron_expr:
            raise HTTPException(status_code=422, detail="cron_expr required for cron schedules")
        try:
            cron = croniter(body.cron_expr, now)
            return cron.get_next(datetime)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Invalid cron expression: {e}") from e
    elif body.schedule_type == "interval":
        if not body.interval_s:
            raise HTTPException(status_code=422, detail="interval_s required for interval schedules")
        from datetime import timedelta
        return now + timedelta(seconds=body.interval_s)
    elif body.schedule_type == "one_shot":
        if not body.run_at:
            raise HTTPException(status_code=422, detail="run_at required for one_shot schedules")
        run_at = body.run_at
        if run_at.tzinfo is None:
            run_at = run_at.replace(tzinfo=tz.utc)
        return run_at
    return None


@router.get("", response_model=list[Schedule])
async def list_schedules(request: Request) -> list[Schedule]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = ScheduleRepo(session)
        rows = await repo.list_all()
    return [_row_to_schema(r) for r in rows]


@router.post("", response_model=Schedule, status_code=201)
async def create_schedule(body: ScheduleCreate, request: Request) -> Schedule:
    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    next_run_at = _compute_initial_next_run(body)

    row = ScheduleRow(
        schedule_id=uuid.uuid4(),
        name=body.name,
        enabled=body.enabled,
        schedule_type=body.schedule_type,
        cron_expr=body.cron_expr,
        interval_s=body.interval_s,
        run_at=body.run_at,
        timezone=body.timezone,
        quiet_hours_start=body.quiet_hours_start,
        quiet_hours_end=body.quiet_hours_end,
        catch_up_policy=body.catch_up_policy,
        catch_up_max=body.catch_up_max,
        event_source=body.event_source,
        event_content=body.event_content,
        event_structured=body.event_structured,
        next_run_at=next_run_at,
    )

    async with session_scope(sessionmaker) as session:
        repo = ScheduleRepo(session)
        saved = await repo.create(row)
        result = _row_to_schema(saved)

    await audit.emit(
        uuid.uuid4(),
        stage="scheduler",
        type="schedule.created",
        summary=f"Schedule {result.name} ({result.schedule_id}) created",
        outcome="success",
        connector_id=str(result.schedule_id),
    )

    return result


@router.patch("/{schedule_id}", response_model=Schedule)
async def patch_schedule(
    schedule_id: uuid.UUID, body: SchedulePatch, request: Request
) -> Schedule:
    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    fields = body.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update")

    async with session_scope(sessionmaker) as session:
        repo = ScheduleRepo(session)
        updated = await repo.update_fields(schedule_id, **fields)

    if updated is None:
        raise HTTPException(status_code=404, detail="Schedule not found")

    await audit.emit(
        uuid.uuid4(),
        stage="scheduler",
        type="schedule.updated",
        summary=f"Schedule {schedule_id} updated: {list(fields.keys())}",
        outcome="success",
        connector_id=str(schedule_id),
    )

    return _row_to_schema(updated)
