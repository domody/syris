"""Autonomy setting repository — data access only, no business logic."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import AutonomySettingRow

_SETTING_ID = "current"
_DEFAULT_LEVEL = "A2"


class AutonomyRepo:
    """Thin data-access wrapper for the autonomy_settings table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_level(self) -> str:
        """Return the current autonomy level. Defaults to A2 if not set."""
        row = await self._session.get(AutonomySettingRow, _SETTING_ID)
        if row is None:
            return _DEFAULT_LEVEL
        return row.level

    async def set_level(
        self,
        level: str,
        updated_by: Optional[str] = None,
    ) -> AutonomySettingRow:
        """Upsert the current autonomy level. Returns the updated row."""
        row = await self._session.get(AutonomySettingRow, _SETTING_ID)
        if row is None:
            row = AutonomySettingRow(
                setting_id=_SETTING_ID,
                level=level,
                updated_at=datetime.now(timezone.utc),
                updated_by=updated_by,
            )
            self._session.add(row)
        else:
            row.level = level
            row.updated_at = datetime.now(timezone.utc)
            row.updated_by = updated_by
        await self._session.flush()
        return row
