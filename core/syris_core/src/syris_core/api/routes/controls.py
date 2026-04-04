import uuid
from typing import Any

from fastapi import APIRouter, Request

from syris_core.observability.audit import AuditWriter
from syris_core.safety.autonomy import AutonomyService
from syris_core.schemas.safety import SetAutonomyRequest

router = APIRouter(prefix="/controls", tags=["controls"])


@router.post("/autonomy", status_code=204)
async def set_autonomy(body: SetAutonomyRequest, request: Request) -> None:
    """Set the system-wide autonomy level."""
    autonomy_service: AutonomyService = request.app.state.autonomy_service
    audit: AuditWriter = request.app.state.audit_writer

    previous_level = await autonomy_service.get_level()
    await autonomy_service.set_level(body.level, updated_by="operator")

    await audit.emit(
        uuid.uuid4(),  # operator action — no event trace_id
        stage="operator",
        type="operator.autonomy_changed",
        summary=(
            f"Autonomy level changed from {previous_level} to {body.level}"
            + (f": {body.reason}" if body.reason else "")
        ),
        outcome="success",
        autonomy_level=body.level,
    )


@router.get("/autonomy", response_model=dict[str, Any])
async def get_autonomy(request: Request) -> dict[str, Any]:
    """Get the current autonomy level."""
    autonomy_service: AutonomyService = request.app.state.autonomy_service
    level = await autonomy_service.get_level()
    return {"level": level}
