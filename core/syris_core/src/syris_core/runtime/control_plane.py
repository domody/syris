from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import uuid

import uvicorn
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from ..api.app import create_app
from ..config import Settings
from ..events.bus import EventBus
from ..logging import configure_logging
from ..observability.audit import AuditWriter
from ..observability.heartbeat import HeartbeatService
from ..pipeline.executor import Executor
from ..pipeline.normalizer import Normalizer
from ..pipeline.router import Router
from ..pipeline.run import run_pipeline
from ..pipeline.responder import Responder
from ..safety.autonomy import AutonomyService
from ..safety.gates import GateChecker
from ..scheduler.loop import SchedulerLoop
from ..schemas.events import RawInput
from ..storage.db import create_engine, create_sessionmaker, init_db
from ..watchers.base import WatcherLoop
from ..watchers.heartbeat import HeartbeatWatcher

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class RuntimeState:
    run_id: uuid.UUID
    started_at: datetime
    engine: AsyncEngine
    sessionmaker: async_sessionmaker[AsyncSession]
    event_bus: EventBus
    heartbeat: HeartbeatService
    audit_writer: AuditWriter
    scheduler_loop: SchedulerLoop
    watcher_loop: WatcherLoop


class ControlPlane:
    """
    Explicit Runtime Orchestrator
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._app = None
        self._runtime: RuntimeState | None = None

    @property
    def app(self):
        if self._app is None:
            raise RuntimeError("ControlPlane not started yet; call start() first.")    
        return self._app
    
    async def start(self) -> None:
        configure_logging(self._settings.log_level)

        engine = create_engine(self._settings.database_url)
        sessionmaker = create_sessionmaker(engine)

        # ensure schema exists
        await init_db(engine)

        run_id = uuid.uuid4()
        started_at = datetime.now(timezone.utc)

        app = create_app(self._settings)

        event_bus = EventBus()

        heartbeat = HeartbeatService(
            sessionmaker,
            run_id=run_id,
            started_at=started_at,
            interval_s=self._settings.heartbeat_interval_s,
            service=self._settings.service_name,
            version=self._settings.version,
            bus=event_bus,
        )
        await heartbeat.start()

        audit_writer = AuditWriter(sessionmaker, bus=event_bus)
        normalizer = Normalizer(audit_writer)
        router = Router(audit_writer)
        executor = Executor(audit_writer)
        responder = Responder(audit_writer)
        autonomy_service = AutonomyService(sessionmaker)

        async def _pipeline(raw: RawInput) -> None:
            await run_pipeline(raw, normalizer, router, executor, responder)

        scheduler_loop = SchedulerLoop(sessionmaker, audit_writer, _pipeline)
        await scheduler_loop.start()

        heartbeat_watcher = HeartbeatWatcher(
            sessionmaker,
            run_id=run_id,
            tick_interval_s=self._settings.heartbeat_interval_s,
        )
        watcher_loop = WatcherLoop(sessionmaker, audit_writer, _pipeline)
        watcher_loop.register(heartbeat_watcher)
        await watcher_loop.start()

        app.state.settings = self._settings
        app.state.engine = engine
        app.state.sessionmaker = sessionmaker
        app.state.run_id = run_id
        app.state.started_at = started_at
        app.state.event_bus = event_bus
        app.state.heartbeat = heartbeat
        app.state.audit_writer = audit_writer
        app.state.normalizer = normalizer
        app.state.router = router
        app.state.executor = executor
        app.state.autonomy_service = autonomy_service
        app.state.scheduler_loop = scheduler_loop
        app.state.watcher_loop = watcher_loop

        self._app = app
        self._runtime = RuntimeState(
            run_id=run_id,
            started_at=started_at,
            engine=engine,
            sessionmaker=sessionmaker,
            event_bus=event_bus,
            heartbeat=heartbeat,
            audit_writer=audit_writer,
            scheduler_loop=scheduler_loop,
            watcher_loop=watcher_loop,
        )

        logger.info(
            "ControlPlane started run_id=%s env=%s db=%s",
            run_id,
            self._settings.env,
            self._settings.database_url,
        )

    async def stop(self) -> None:
        if self._runtime is None:
            return
        
        logger.info("ControlPlane stopping run_id=%s", self._runtime.run_id)
        await self._runtime.scheduler_loop.stop()
        await self._runtime.watcher_loop.stop()
        await self._runtime.heartbeat.stop()
        await self._runtime.engine.dispose()

        self._runtime = None
        self._app = None

    async def run(self) -> None:
        """
        Start the runtime and serve HTTP until shutdown signal
        """
        await self.start()
        
        config = uvicorn.Config(
            self.app,
            host=self._settings.api_host,
            port=self._settings.api_port,
            log_level=self._settings.log_level.lower(),
            lifespan="off"
        )
        server = uvicorn.Server(config)

        try:
            await server.serve()
        finally:
            await self.stop()