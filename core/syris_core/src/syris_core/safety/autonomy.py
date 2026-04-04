"""
AutonomyService — read/write the current autonomy level.

The service caches the level in memory to avoid a DB round-trip on every
gate check. The cache is invalidated whenever the level is changed via
set_level(). On startup, the cached value is populated on first read.
"""
import asyncio
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..storage.db import session_scope
from ..storage.repos.autonomy import AutonomyRepo

logger = logging.getLogger(__name__)

_DEFAULT_LEVEL = "A2"


class AutonomyService:
    """
    Manages the system-wide autonomy level.

    Wraps AutonomyRepo with an in-memory cache so callers can read the
    current level synchronously without an awaited DB call.
    """

    def __init__(self, session_maker: async_sessionmaker[AsyncSession]) -> None:
        self._session_maker = session_maker
        self._cached_level: Optional[str] = None
        self._lock = asyncio.Lock()

    async def get_level(self) -> str:
        """Return the current autonomy level, loading from DB if needed."""
        if self._cached_level is not None:
            return self._cached_level

        async with self._lock:
            # Double-check inside the lock
            if self._cached_level is not None:
                return self._cached_level

            async with session_scope(self._session_maker) as session:
                repo = AutonomyRepo(session)
                level = await repo.get_level()
            self._cached_level = level
            logger.info("autonomy.loaded level=%s", level)
            return level

    async def set_level(
        self,
        level: str,
        updated_by: Optional[str] = None,
    ) -> None:
        """Persist a new autonomy level and update the in-memory cache."""
        async with self._lock:
            async with session_scope(self._session_maker) as session:
                repo = AutonomyRepo(session)
                await repo.set_level(level, updated_by=updated_by)
            self._cached_level = level
            logger.info(
                "autonomy.changed level=%s updated_by=%s", level, updated_by
            )
