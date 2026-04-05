"""
Register all built-in tools.

To add a new built-in tool:
  1. Write a BaseTool subclass (new file or existing domain file).
  2. Import it here and add one register() call in register_built_ins().
  Nothing else changes.
"""
from ..registry import ToolRegistry
from .approvals import ApprovalApproveTool, ApprovalDenyTool, ApprovalListTool
from .autonomy import AutonomySetTool
from .schedules import (
    ScheduleCancelTool,
    ScheduleCreateTool,
    ScheduleListTool,
    SchedulePauseTool,
)
from .tasks import TaskCancelTool, TaskStatusTool


def register_built_ins(registry: ToolRegistry) -> None:
    """Register all built-in tools. Call once at startup."""
    for cls in [
        ScheduleCreateTool,
        ScheduleListTool,
        ScheduleCancelTool,
        SchedulePauseTool,
        TaskStatusTool,
        TaskCancelTool,
        AutonomySetTool,
        ApprovalListTool,
        ApprovalApproveTool,
        ApprovalDenyTool,
    ]:
        registry.register(cls)
