"""Built-in autonomy control tool."""
import logging
from typing import ClassVar, Literal

from pydantic import BaseModel, Field

from ..base import BaseTool, RiskLevel, ToolDeps, ToolResult

logger = logging.getLogger(__name__)

_VALID_LEVELS = {"A0", "A1", "A2", "A3", "A4"}


class AutonomySetArgs(BaseModel):
    level: Literal["A0", "A1", "A2", "A3", "A4"] = Field(
        ...,
        description=(
            "Target autonomy level: A0=suggest-only, A1=confirm-all, "
            "A2=scoped, A3=high, A4=full"
        ),
    )


class AutonomySetTool(BaseTool):
    name: ClassVar[str] = "autonomy.set"
    description: ClassVar[str] = "Set the system-wide autonomy level (A0 through A4)."
    args_schema: ClassVar[type[BaseModel]] = AutonomySetArgs
    risk_level: ClassVar[RiskLevel] = "high"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: AutonomySetArgs) -> ToolResult:  # type: ignore[override]
        await self._deps.autonomy_service.set_level(args.level, updated_by="pipeline")
        return ToolResult(
            summary=f"Autonomy level set to {args.level}",
            data={"level": args.level},
        )
