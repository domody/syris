from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from syris_core.schemas.tasks import RetryPolicy, StepSpec, Task, TaskStep, TaskSubmit
from syris_core.storage.db import session_scope
from syris_core.storage.models import TaskRow, TaskStepRow
from syris_core.storage.repos.tasks import TaskRepo
from syris_core.tasks.engine import TaskEngine

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskResponse(BaseModel):
    """API response shape for a task (includes step summaries)."""

    task_id: UUID
    trace_id: UUID
    status: str
    handler: str
    input_payload: dict[str, Any]
    checkpoint: dict[str, Any]
    retry_policy: dict[str, Any]
    error: Optional[str]
    created_at: str
    updated_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    steps: list[dict[str, Any]]


def _row_to_response(task_row: TaskRow, steps: list[TaskStepRow]) -> TaskResponse:
    return TaskResponse(
        task_id=task_row.task_id,
        trace_id=task_row.trace_id,
        status=task_row.status,
        handler=task_row.handler,
        input_payload=task_row.input_payload,
        checkpoint=task_row.checkpoint,
        retry_policy=task_row.retry_policy,
        error=task_row.error,
        created_at=task_row.created_at.isoformat(),
        updated_at=task_row.updated_at.isoformat(),
        started_at=task_row.started_at.isoformat() if task_row.started_at else None,
        completed_at=task_row.completed_at.isoformat() if task_row.completed_at else None,
        steps=[
            {
                "step_id": str(s.step_id),
                "step_index": s.step_index,
                "status": s.status,
                "tool_name": s.tool_name,
                "attempt_count": s.attempt_count,
                "error": s.error,
            }
            for s in steps
        ],
    )


@router.get("", response_model=list[TaskResponse])
async def list_tasks(request: Request, limit: int = 50) -> list[TaskResponse]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = TaskRepo(session)
        task_rows = await repo.list_tasks(limit=limit)
        result = []
        for task_row in task_rows:
            steps = await repo.get_steps(task_row.task_id)
            result.append(_row_to_response(task_row, steps))
    return result


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: UUID, request: Request) -> TaskResponse:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = TaskRepo(session)
        task_row = await repo.get_task(task_id)
        if task_row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        steps = await repo.get_steps(task_id)
    return _row_to_response(task_row, steps)


@router.post("", response_model=TaskResponse, status_code=201)
async def submit_task(body: TaskSubmit, request: Request) -> TaskResponse:
    engine: TaskEngine = request.app.state.task_engine
    task = await engine.submit(body)
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = TaskRepo(session)
        task_row = await repo.get_task(task.task_id)
        steps = await repo.get_steps(task.task_id)
    return _row_to_response(task_row, steps)


@router.post("/{task_id}/cancel", status_code=204)
async def cancel_task(task_id: UUID, request: Request) -> None:
    engine: TaskEngine = request.app.state.task_engine
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = TaskRepo(session)
        task_row = await repo.get_task(task_id)
        if task_row is None:
            raise HTTPException(status_code=404, detail="Task not found")
    try:
        await engine.cancel(task_id, task_row.trace_id)
    except (ValueError, Exception) as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/{task_id}/pause", status_code=204)
async def pause_task(task_id: UUID, request: Request) -> None:
    engine: TaskEngine = request.app.state.task_engine
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = TaskRepo(session)
        task_row = await repo.get_task(task_id)
        if task_row is None:
            raise HTTPException(status_code=404, detail="Task not found")
    try:
        await engine.pause(task_id, task_row.trace_id)
    except (ValueError, Exception) as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/{task_id}/resume", status_code=204)
async def resume_task(task_id: UUID, request: Request) -> None:
    engine: TaskEngine = request.app.state.task_engine
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = TaskRepo(session)
        task_row = await repo.get_task(task_id)
        if task_row is None:
            raise HTTPException(status_code=404, detail="Task not found")
    try:
        await engine.resume(task_id, task_row.trace_id)
    except (ValueError, Exception) as exc:
        raise HTTPException(status_code=409, detail=str(exc))
