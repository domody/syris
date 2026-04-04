"""
GateChecker — gate matrix + hard safety overrides.

The gate matrix maps (autonomy_level, risk_level) → GateAction.
Hard overrides are evaluated before the matrix and can only increase
the gate action (never lower it to ALLOW).

Usage::
    checker = GateChecker(autonomy_service, approval_repo, audit_writer)

    decision = await checker.check(
        trace_id=event.trace_id,
        tool_name="lights.control",
        risk_level="medium",
        autonomy_level="A1",
        what={"tool": "lights.control", "action": "turn_on", "target": "all"},
        why="Task step requires light control",
        ref_step_id=step.step_id,
        ref_task_id=task.task_id,
    )

    if decision.action == "ALLOW":
        await execute_tool(...)
    elif decision.action == "CONFIRM":
        # approval was created — block until approved
        ...
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from ..observability.audit import AuditWriter
from ..schemas.safety import Approval, GateAction, GateDecision
from ..storage.repos.approvals import ApprovalRepo
from .autonomy import AutonomyService

logger = logging.getLogger(__name__)

# Gate matrix: (autonomy_level, risk_level) → GateAction
_GATE_MATRIX: dict[tuple[str, str], GateAction] = {
    # A0 — suggest-only
    ("A0", "low"):      "PREVIEW",
    ("A0", "medium"):   "PREVIEW",
    ("A0", "high"):     "PREVIEW",
    ("A0", "critical"): "PREVIEW",
    # A1 — confirm required
    ("A1", "low"):      "CONFIRM",
    ("A1", "medium"):   "CONFIRM",
    ("A1", "high"):     "CONFIRM",
    ("A1", "critical"): "HARD_BLOCK",
    # A2 — scoped autonomy
    ("A2", "low"):      "ALLOW",
    ("A2", "medium"):   "CONFIRM",
    ("A2", "high"):     "CONFIRM",
    ("A2", "critical"): "HARD_BLOCK",
    # A3 — high autonomy
    ("A3", "low"):      "ALLOW",
    ("A3", "medium"):   "ALLOW",
    ("A3", "high"):     "CONFIRM",
    ("A3", "critical"): "HARD_BLOCK",
    # A4 — full autonomy
    ("A4", "low"):      "ALLOW",
    ("A4", "medium"):   "ALLOW",
    ("A4", "high"):     "ALLOW",
    ("A4", "critical"): "CONFIRM",
}

# Order for "can only increase" logic
_ACTION_RANK: dict[GateAction, int] = {
    "ALLOW":      0,
    "PREVIEW":    1,
    "CONFIRM":    2,
    "HARD_BLOCK": 3,
}

_DEFAULT_APPROVAL_TTL_SECONDS = 3600  # 1 hour


def _max_action(a: GateAction, b: GateAction) -> GateAction:
    return a if _ACTION_RANK[a] >= _ACTION_RANK[b] else b


class GateChecker:
    """
    Evaluates gate decisions for tool actions.

    Applies hard safety overrides first, then falls back to the gate matrix.
    When the action is CONFIRM, creates and persists an Approval record.
    """

    def __init__(
        self,
        audit: AuditWriter,
        approval_repo: ApprovalRepo,
        autonomy_service: AutonomyService,
        approval_ttl_s: int = _DEFAULT_APPROVAL_TTL_SECONDS,
    ) -> None:
        self._audit = audit
        self._approval_repo = approval_repo
        self._autonomy_service = autonomy_service
        self._approval_ttl_s = approval_ttl_s

    async def current_autonomy_level(self) -> str:
        """Return the current autonomy level from the service."""
        return await self._autonomy_service.get_level()

    async def check(
        self,
        trace_id: UUID,
        tool_name: str,
        risk_level: str,
        autonomy_level: str,
        what: dict[str, Any],
        why: str,
        *,
        requires_secrets_scope: bool = False,
        within_quiet_hours: bool = False,
        ref_event_id: Optional[UUID] = None,
        ref_task_id: Optional[UUID] = None,
        ref_step_id: Optional[UUID] = None,
        approved_approval_id: Optional[UUID] = None,
    ) -> GateDecision:
        """
        Compute the gate action for a tool call.

        If `approved_approval_id` is provided and the corresponding approval
        is in `approved` status, the gate bypasses CONFIRM and returns ALLOW.

        Returns a GateDecision. If action is CONFIRM, the decision includes
        the newly created Approval. Callers must persist the approval via
        ApprovalRepo (which this method uses directly).
        """
        # Check if there is an already-approved approval for this step
        if approved_approval_id is not None or ref_step_id is not None:
            existing = None
            if ref_step_id is not None:
                existing = await self._approval_repo.get_approved_for_step(ref_step_id)
            if existing is not None:
                logger.info(
                    "gate.already_approved tool=%s approval_id=%s",
                    tool_name,
                    existing.approval_id,
                )
                await self._audit.emit(
                    trace_id,
                    stage="gate",
                    type="gate.approved",
                    summary=(
                        f"Gate approved for {tool_name} — approval {existing.approval_id} "
                        f"already granted"
                    ),
                    outcome="success",
                    tool_name=tool_name,
                    risk_level=risk_level,  # type: ignore[arg-type]
                    autonomy_level=autonomy_level,  # type: ignore[arg-type]
                    ref_task_id=ref_task_id,
                    ref_step_id=ref_step_id,
                    ref_approval_id=existing.approval_id,
                )
                return GateDecision(action="ALLOW", reason="Prior approval granted")

        # Determine base action from matrix
        matrix_key = (autonomy_level, risk_level)
        action: GateAction = _GATE_MATRIX.get(matrix_key, "HARD_BLOCK")

        # Hard override 1: secrets scope → always CONFIRM
        if requires_secrets_scope:
            action = _max_action(action, "CONFIRM")
            why = f"{why} [secrets scope required]"

        # Hard override 2: quiet hours + medium/high risk → CONFIRM
        if within_quiet_hours and risk_level in ("medium", "high"):
            action = _max_action(action, "CONFIRM")
            why = f"{why} [quiet hours active]"

        if action == "ALLOW":
            await self._audit.emit(
                trace_id,
                stage="gate",
                type="gate.allowed",
                summary=f"Gate allowed {tool_name} (risk={risk_level}, autonomy={autonomy_level})",
                outcome="success",
                tool_name=tool_name,
                risk_level=risk_level,  # type: ignore[arg-type]
                autonomy_level=autonomy_level,  # type: ignore[arg-type]
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
            )
            return GateDecision(action="ALLOW", reason="Gate matrix: ALLOW")

        if action == "HARD_BLOCK":
            await self._audit.emit(
                trace_id,
                stage="gate",
                type="gate.hard_blocked",
                summary=f"Gate hard-blocked {tool_name} (risk={risk_level}, autonomy={autonomy_level})",
                outcome="failure",
                tool_name=tool_name,
                risk_level=risk_level,  # type: ignore[arg-type]
                autonomy_level=autonomy_level,  # type: ignore[arg-type]
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
            )
            return GateDecision(action="HARD_BLOCK", reason="Gate matrix: HARD_BLOCK")

        if action == "PREVIEW":
            await self._audit.emit(
                trace_id,
                stage="gate",
                type="gate.preview",
                summary=f"Gate preview for {tool_name} (risk={risk_level}, autonomy={autonomy_level})",
                outcome="info",
                tool_name=tool_name,
                risk_level=risk_level,  # type: ignore[arg-type]
                autonomy_level=autonomy_level,  # type: ignore[arg-type]
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
            )
            return GateDecision(action="PREVIEW", reason="Gate matrix: PREVIEW (A0 suggest-only)")

        # action == "CONFIRM" — create approval record
        approval_id = uuid4()
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self._approval_ttl_s)
        approval = Approval(
            approval_id=approval_id,
            trace_id=trace_id,
            expires_at=expires_at,
            status="pending",
            ref_event_id=ref_event_id,
            ref_task_id=ref_task_id,
            ref_step_id=ref_step_id,
            risk_level=risk_level,
            autonomy_level=autonomy_level,
            what=what,
            why=why,
            how_to_approve=f"POST /approvals/{approval_id}/approve",
        )

        await self._approval_repo.create(approval)

        await self._audit.emit(
            trace_id,
            stage="gate",
            type="gate.required",
            summary=(
                f"Gate requires approval for {tool_name} "
                f"(risk={risk_level}, autonomy={autonomy_level}): {why}"
            ),
            outcome="info",
            tool_name=tool_name,
            risk_level=risk_level,  # type: ignore[arg-type]
            autonomy_level=autonomy_level,  # type: ignore[arg-type]
            ref_task_id=ref_task_id,
            ref_step_id=ref_step_id,
            ref_approval_id=approval.approval_id,
        )
        logger.info(
            "gate.required tool=%s risk=%s autonomy=%s approval_id=%s",
            tool_name,
            risk_level,
            autonomy_level,
            approval.approval_id,
        )
        return GateDecision(
            action="CONFIRM",
            reason=f"Gate matrix: CONFIRM ({why})",
            approval=approval,
        )
