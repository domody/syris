from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import QuietHoursPolicyRow, RuleRow


class RuleRepo:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, row: RuleRow) -> RuleRow:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, rule_id: UUID) -> Optional[RuleRow]:
        return await self._session.get(RuleRow, rule_id)

    async def list_all(self) -> list[RuleRow]:
        result = await self._session.execute(select(RuleRow))
        return list(result.scalars().all())

    async def list_enabled(self) -> list[RuleRow]:
        stmt = select(RuleRow).where(RuleRow.enabled == True)  # noqa: E712
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_name(self, name: str) -> list[RuleRow]:
        stmt = select(RuleRow).where(RuleRow.name == name)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update_fields(self, rule_id: UUID, **fields: Any) -> Optional[RuleRow]:
        fields["updated_at"] = datetime.now(timezone.utc)
        stmt = (
            update(RuleRow)
            .where(RuleRow.rule_id == rule_id)
            .values(**fields)
            .returning(RuleRow)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def claim_for_fire(self, rule_id: UUID, now: datetime) -> Optional[RuleRow]:
        """Atomically check debounce and claim this rule for firing.

        Uses SELECT ... FOR UPDATE to serialize concurrent evaluations.
        Returns the updated row if the rule should fire, None if debounced.
        When firing, updates last_fired_at and increments fire_count.
        """
        stmt = (
            select(RuleRow)
            .where(RuleRow.rule_id == rule_id)
            .with_for_update()
        )
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None

        if (
            row.debounce_s > 0
            and row.last_fired_at is not None
            and (now - row.last_fired_at).total_seconds() < row.debounce_s
        ):
            return None

        update_stmt = (
            update(RuleRow)
            .where(RuleRow.rule_id == rule_id)
            .values(last_fired_at=now, fire_count=RuleRow.fire_count + 1, updated_at=now)
            .returning(RuleRow)
        )
        updated = await self._session.execute(update_stmt)
        return updated.scalar_one()


class QuietHoursPolicyRepo:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, row: QuietHoursPolicyRow) -> QuietHoursPolicyRow:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, policy_id: UUID) -> Optional[QuietHoursPolicyRow]:
        return await self._session.get(QuietHoursPolicyRow, policy_id)

    async def list_all(self) -> list[QuietHoursPolicyRow]:
        result = await self._session.execute(select(QuietHoursPolicyRow))
        return list(result.scalars().all())
