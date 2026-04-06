import uuid
from datetime import timezone

from fastapi import APIRouter, HTTPException, Request

from syris_core.observability.audit import AuditWriter
from syris_core.schemas.rules import Rule, RuleAction, RuleCondition, RuleCreate, RulePatch
from syris_core.storage.db import session_scope
from syris_core.storage.models import RuleRow
from syris_core.storage.repos.rules import RuleRepo

router = APIRouter(prefix="/rules", tags=["rules"])


def _row_to_schema(row: RuleRow) -> Rule:
    return Rule(
        rule_id=row.rule_id,
        name=row.name,
        enabled=row.enabled,
        conditions=[RuleCondition(**c) for c in (row.conditions or [])],
        action=RuleAction(**row.action),
        debounce_s=row.debounce_s,
        last_fired_at=row.last_fired_at,
        suppression_count=row.suppression_count,
        fire_count=row.fire_count,
        quiet_hours_policy_id=row.quiet_hours_policy_id,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("", response_model=list[Rule])
async def list_rules(request: Request) -> list[Rule]:
    sessionmaker = request.app.state.sessionmaker
    async with session_scope(sessionmaker) as session:
        rows = await RuleRepo(session).list_all()
    return [_row_to_schema(r) for r in rows]


@router.post("", response_model=Rule, status_code=201)
async def create_rule(body: RuleCreate, request: Request) -> Rule:
    from datetime import datetime

    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    now = datetime.now(timezone.utc)
    row = RuleRow(
        rule_id=uuid.uuid4(),
        name=body.name,
        enabled=body.enabled,
        conditions=[c.model_dump() for c in body.conditions],
        action=body.action.model_dump(),
        debounce_s=body.debounce_s,
        quiet_hours_policy_id=body.quiet_hours_policy_id,
        created_at=now,
        updated_at=now,
    )

    async with session_scope(sessionmaker) as session:
        saved = await RuleRepo(session).create(row)
        result = _row_to_schema(saved)

    await audit.emit(
        uuid.uuid4(),
        stage="rule",
        type="rule.created",
        summary=f"Rule '{result.name}' ({result.rule_id}) created",
        outcome="success",
        connector_id=str(result.rule_id),
    )

    return result


@router.patch("/{rule_id}", response_model=Rule)
async def patch_rule(rule_id: uuid.UUID, body: RulePatch, request: Request) -> Rule:
    sessionmaker = request.app.state.sessionmaker
    audit: AuditWriter = request.app.state.audit_writer

    fields = body.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update")

    # Serialise nested Pydantic objects to plain dicts for storage
    if "conditions" in fields and fields["conditions"] is not None:
        fields["conditions"] = [
            c.model_dump() if hasattr(c, "model_dump") else c
            for c in fields["conditions"]
        ]
    if "action" in fields and fields["action"] is not None:
        action = fields["action"]
        if hasattr(action, "model_dump"):
            fields["action"] = action.model_dump()

    async with session_scope(sessionmaker) as session:
        updated = await RuleRepo(session).update_fields(rule_id, **fields)

    if updated is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    await audit.emit(
        uuid.uuid4(),
        stage="rule",
        type="rule.updated",
        summary=f"Rule {rule_id} updated: {list(fields.keys())}",
        outcome="success",
        connector_id=str(rule_id),
    )

    return _row_to_schema(updated)
