"""Built-in approval management tools."""
import logging
from typing import ClassVar, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ...storage.db import session_scope
from ...storage.repos.approvals import ApprovalRepo
from ..base import BaseTool, RiskLevel, ToolDeps, ToolResult

logger = logging.getLogger(__name__)


class ApprovalListArgs(BaseModel):
    pass


class ApprovalListTool(BaseTool):
    name: ClassVar[str] = "approval.list"
    description: ClassVar[str] = "List all pending approvals awaiting operator decision."
    args_schema: ClassVar[type[BaseModel]] = ApprovalListArgs
    risk_level: ClassVar[RiskLevel] = "low"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: ApprovalListArgs) -> ToolResult:  # type: ignore[override]
        async with session_scope(self._deps.session_maker) as session:
            rows = await ApprovalRepo(session).list_pending()
        return ToolResult(
            summary=f"{len(rows)} pending approval(s)",
            data={
                "count": len(rows),
                "approval_ids": [str(r.approval_id) for r in rows],
            },
        )


class ApprovalApproveArgs(BaseModel):
    approval_id: UUID = Field(..., description="UUID of the approval to approve")
    reason: Optional[str] = Field(None, description="Reason for the approval decision")


class ApprovalApproveTool(BaseTool):
    name: ClassVar[str] = "approval.approve"
    description: ClassVar[str] = "Approve a pending operator approval request by ID."
    args_schema: ClassVar[type[BaseModel]] = ApprovalApproveArgs
    risk_level: ClassVar[RiskLevel] = "medium"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: ApprovalApproveArgs) -> ToolResult:  # type: ignore[override]
        reason = args.reason or "Approved via pipeline"
        async with session_scope(self._deps.session_maker) as session:
            await ApprovalRepo(session).decide(
                args.approval_id,
                "approved",
                decision_reason=reason,
            )
        return ToolResult(
            summary=f"Approved {args.approval_id}",
            data={"approval_id": str(args.approval_id), "status": "approved"},
        )


class ApprovalDenyArgs(BaseModel):
    approval_id: UUID = Field(..., description="UUID of the approval to deny")
    reason: Optional[str] = Field(None, description="Reason for the denial")


class ApprovalDenyTool(BaseTool):
    name: ClassVar[str] = "approval.deny"
    description: ClassVar[str] = "Deny a pending operator approval request by ID."
    args_schema: ClassVar[type[BaseModel]] = ApprovalDenyArgs
    risk_level: ClassVar[RiskLevel] = "medium"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: ApprovalDenyArgs) -> ToolResult:  # type: ignore[override]
        reason = args.reason or "Denied via pipeline"
        async with session_scope(self._deps.session_maker) as session:
            await ApprovalRepo(session).decide(
                args.approval_id,
                "denied",
                decision_reason=reason,
            )
        return ToolResult(
            summary=f"Denied {args.approval_id}",
            data={"approval_id": str(args.approval_id), "status": "denied"},
        )
