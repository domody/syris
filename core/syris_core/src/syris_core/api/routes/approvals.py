from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import update as sa_update

from syris_core.observability.audit import AuditWriter
from syris_core.schemas.safety import ApproveRequest, DenyRequest
from syris_core.storage.db import session_scope
from syris_core.storage.models import ApprovalRow, TaskRow, TaskStepRow
from syris_core.storage.repos.approvals import ApprovalRepo
from syris_core.storage.repos.tasks import TaskRepo
from syris_core.tasks.state import assert_step_transition, assert_task_transition

router = APIRouter(prefix="/approvals", tags=["approvals"])


def _row_to_dict(row: ApprovalRow) -> dict[str, Any]:
    return {
        "approval_id": str(row.approval_id),
        "created_at": row.created_at.isoformat(),
        "expires_at": row.expires_at.isoformat(),
        "status": row.status,
        "trace_id": str(row.trace_id),
        "ref_event_id": str(row.ref_event_id) if row.ref_event_id else None,
        "ref_task_id": str(row.ref_task_id) if row.ref_task_id else None,
        "ref_step_id": str(row.ref_step_id) if row.ref_step_id else None,
        "risk_level": row.risk_level,
        "autonomy_level": row.autonomy_level,
        "what": row.what,
        "why": row.why,
        "how_to_approve": row.how_to_approve,
        "decided_by": row.decided_by,
        "decided_at": row.decided_at.isoformat() if row.decided_at else None,
        "decision_reason": row.decision_reason,
    }


@router.get("", response_model=list[dict[str, Any]])
async def list_approvals(
    request: Request,
    status: Optional[str] = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = ApprovalRepo(session)
        if status == "pending":
            rows = await repo.list_pending()
        else:
            rows = await repo.list_all(limit=limit)
    return [_row_to_dict(r) for r in rows]


@router.get("/{approval_id}", response_model=dict[str, Any])
async def get_approval(approval_id: UUID, request: Request) -> dict[str, Any]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        repo = ApprovalRepo(session)
        row = await repo.get(approval_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Approval not found")
    return _row_to_dict(row)


@router.post("/{approval_id}/approve", status_code=204)
async def approve(
    approval_id: UUID,
    body: ApproveRequest,
    request: Request,
) -> None:
    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    async with session_scope(sessionmaker) as session:
        approval_repo = ApprovalRepo(session)
        row = await approval_repo.get(approval_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Approval not found")
        if row.status != "pending":
            raise HTTPException(
                status_code=409,
                detail=f"Approval is already {row.status}",
            )

        trace_id = row.trace_id
        ref_task_id = row.ref_task_id
        ref_step_id = row.ref_step_id

        await approval_repo.decide(
            approval_id,
            "approved",
            decided_by="operator",
            decision_reason=body.reason,
        )

        # Reset the gated step to pending so the task engine can re-run it
        if ref_step_id is not None:
            task_repo = TaskRepo(session)
            step_row = await session.get(TaskStepRow, ref_step_id)
            if step_row is not None and step_row.status == "gated":
                assert_step_transition(step_row.status, "pending")
                await task_repo.update_step_status(ref_step_id, "pending")

        # Re-queue the task to pending so the engine picks it up
        if ref_task_id is not None:
            task_repo = TaskRepo(session)
            task_row = await task_repo.get_task(ref_task_id)
            if task_row is not None and task_row.status == "paused":
                # Re-queue directly via SQL to bypass state machine
                # (paused → running is the valid transition, but we want pending
                # so claim_and_run can atomically re-claim it)
                stmt = (
                    sa_update(TaskRow)
                    .where(TaskRow.task_id == ref_task_id)
                    .values(status="pending", updated_at=datetime.now(timezone.utc))
                )
                await session.execute(stmt)

    await audit.emit(
        trace_id,
        stage="gate",
        type="gate.approved",
        summary=f"Approval {approval_id} approved by operator",
        outcome="success",
        ref_task_id=ref_task_id,
        ref_step_id=ref_step_id,
        ref_approval_id=approval_id,
    )


@router.post("/{approval_id}/deny", status_code=204)
async def deny(
    approval_id: UUID,
    body: DenyRequest,
    request: Request,
) -> None:
    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    async with session_scope(sessionmaker) as session:
        approval_repo = ApprovalRepo(session)
        row = await approval_repo.get(approval_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Approval not found")
        if row.status != "pending":
            raise HTTPException(
                status_code=409,
                detail=f"Approval is already {row.status}",
            )

        trace_id = row.trace_id
        ref_task_id = row.ref_task_id
        ref_step_id = row.ref_step_id

        await approval_repo.decide(
            approval_id,
            "denied",
            decided_by="operator",
            decision_reason=body.reason,
        )

        # Mark the gated step as failed
        if ref_step_id is not None:
            task_repo = TaskRepo(session)
            step_row = await session.get(TaskStepRow, ref_step_id)
            if step_row is not None and step_row.status == "gated":
                assert_step_transition(step_row.status, "failed")
                await task_repo.update_step_status(
                    ref_step_id,
                    "failed",
                    error="Approval denied by operator",
                )

    await audit.emit(
        trace_id,
        stage="gate",
        type="gate.denied",
        summary=f"Approval {approval_id} denied by operator",
        outcome="failure",
        ref_task_id=ref_task_id,
        ref_step_id=ref_step_id,
        ref_approval_id=approval_id,
    )
