from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from syris_core.tools.registry import TOOL_REGISTRY

from .schemas.ha import HAControlArgs, HAQueryArgs
from .schemas.plan import PlanCreateArgs, PlanGenerateReportArgs, PlanRunDiagnosticsArgs
from .schemas.schedule import (
    ScheduleSetAlarmArgs,
    ScheduleSetReminderArgs,
    ScheduleSetTimerArgs,
)
from .schemas.tool import ToolArgs


def _build_schema_registry() -> dict[str, type[BaseModel]]:
    registry: dict[str, type[BaseModel]] = {
        "ha.control": HAControlArgs,
        "ha.query": HAQueryArgs,
        "schedule.set_timer": ScheduleSetTimerArgs,
        "schedule.set_alarm": ScheduleSetAlarmArgs,
        "schedule.set_reminder": ScheduleSetReminderArgs,
        "plan.create_plan": PlanCreateArgs,
        "plan.generate_report": PlanGenerateReportArgs,
        "plan.run_diagnostics": PlanRunDiagnosticsArgs,
    }

    for tool_name in TOOL_REGISTRY.keys():
        registry.setdefault(tool_name, ToolArgs)

    return registry


SCHEMA_REGISTRY: dict[str, type[BaseModel]] = _build_schema_registry()


def resolve_schema(schema_id: str) -> type[BaseModel] | None:
    return SCHEMA_REGISTRY.get(schema_id)


def resolve_schema_json(schema_id: str) -> dict[str, Any]:
    model = resolve_schema(schema_id)
    if model is None:
        return {}
    return model.model_json_schema()
