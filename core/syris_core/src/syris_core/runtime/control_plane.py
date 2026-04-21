from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import uuid
from typing import Any

import uvicorn
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from ..api.app import create_app
from ..config import Settings
from ..events.bus import EventBus
from ..logging import configure_logging
from ..llm.client import LLMClient
from ..llm.context import ContextBuilder
from ..llm.providers.ollama import OllamaProvider
from ..observability.audit import AuditWriter
from ..observability.heartbeat import HeartbeatService
from ..pipeline.executor import Executor
from ..pipeline.handlers import (
    make_rule_create_handler,
    make_rule_disable_handler,
    make_rule_enable_handler,
    make_rule_list_handler,
    make_timer_set_handler,
)
from ..rules.engine import RulesEngine
from ..pipeline.normalizer import Normalizer
from ..pipeline.responder import Responder
from ..pipeline.router import Router
from ..pipeline.run import run_pipeline
from ..safety.autonomy import AutonomyService
from ..safety.gates import GateChecker
from ..scheduler.loop import SchedulerLoop
from ..schemas.events import RawInput
from ..schemas.safety import Approval
from ..storage.db import create_engine, create_sessionmaker, init_db, session_scope
from ..storage.models import ApprovalRow
from ..storage.repos.approvals import ApprovalRepo
from ..tasks.engine import TaskEngine
from ..tasks.llm_step import LLMDecideHandler
from ..tools.base import ToolDeps
from ..tools.built_in import register_built_ins
from ..tools.executor import ToolExecutor
from ..tools.registry import ToolRegistry
from ..tasks.recovery import TaskRecovery
from ..watchers.base import WatcherLoop
from ..watchers.heartbeat import HeartbeatWatcher
from ..notifications.notifier import Notifier
from ..notifications.channels.ntfy import NtfyChannel

logger = logging.getLogger(__name__)


class _SessionedApprovalRepo:
    """ApprovalRepo shim that opens its own session per call.

    GateChecker needs an ApprovalRepo but is constructed once at startup,
    before any per-request session is available. This shim satisfies the
    interface by opening a fresh session for each approval operation.
    """

    def __init__(self, sm: async_sessionmaker[AsyncSession]) -> None:
        self._sm = sm

    async def get_approved_for_step(
        self, step_id: uuid.UUID
    ) -> Any:  # Optional[ApprovalRow]
        async with session_scope(self._sm) as session:
            return await ApprovalRepo(session).get_approved_for_step(step_id)

    async def create(self, approval: Approval) -> ApprovalRow:
        async with session_scope(self._sm) as session:
            return await ApprovalRepo(session).create(approval)


async def _noop_get_secret(connector_id: str, key: str) -> str:
    """Placeholder secrets provider. Replace with a real SecretsStore implementation."""
    raise NotImplementedError(
        f"No secrets store configured. Cannot retrieve secret '{key}' for '{connector_id}'."
    )


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
    """Explicit Runtime Orchestrator."""

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

        # Safety
        autonomy_service = AutonomyService(sessionmaker)
        gate_checker = GateChecker(
            audit=audit_writer,
            approval_repo=_SessionedApprovalRepo(sessionmaker),  # type: ignore[arg-type]
            autonomy_service=autonomy_service,
        )

        # Tool registry — single source of truth for all system capabilities
        tool_deps = ToolDeps(
            session_maker=sessionmaker,
            audit=audit_writer,
            autonomy_service=autonomy_service,
            get_secret=_noop_get_secret,
        )
        tool_registry = ToolRegistry()
        register_built_ins(tool_registry)

        # Construct ToolExecutor early — LLMClient and pipeline share the
        # same gated instance for LLM-initiated and direct dispatch.
        tool_executor = ToolExecutor(tool_registry, tool_deps, gate_checker=gate_checker)

        # LLM client with context builder (needs tool_registry to be populated)
        ollama_provider = OllamaProvider(
            self._settings.llm.base_url, self._settings.llm.model
        )
        context_builder = ContextBuilder(sessionmaker, tool_registry)
        llm_client = LLMClient(
            ollama_provider, audit_writer, self._settings.llm.system_prompt,
            context_builder=context_builder,
            tool_executor=tool_executor,
            tool_registry=tool_registry,
        )

        # Task engine — step handlers from registry (gate owned by StepRunner)
        step_handlers = tool_registry.as_step_handlers(tool_deps)
        llm_decide_handler = LLMDecideHandler(llm_client, tool_registry)
        step_handlers["llm_decide"] = llm_decide_handler

        task_engine = TaskEngine(
            session_maker=sessionmaker,
            audit=audit_writer,
            handlers=step_handlers,
            gate_checker=gate_checker,
        )

        # Run startup crash recovery before the claim loop starts
        recovery = TaskRecovery(audit_writer)
        async with session_scope(sessionmaker) as session:
            await recovery.reconcile(session)

        # Pipeline executor: fastpath regex handlers only.
        # "llm_conversation" is handled by the Responder — no registration needed.
        pipeline_handlers = {
            "timer.set": make_timer_set_handler(sessionmaker),
            "rule.list": make_rule_list_handler(sessionmaker),
            "rule.enable": make_rule_enable_handler(sessionmaker, audit_writer),
            "rule.disable": make_rule_disable_handler(sessionmaker, audit_writer),
            "rule.create": make_rule_create_handler(sessionmaker, audit_writer),
        }

        # Rules engine — evaluates IFTTT rules before routing
        rules_engine = RulesEngine(sessionmaker, audit_writer)

        # Pipeline stages
        normalizer = Normalizer(audit_writer, session_maker=sessionmaker)
        router = Router(audit_writer)
        executor = Executor(audit_writer, handlers=pipeline_handlers)
        responder = Responder(llm_client, audit_writer, sessionmaker)
        notifier = Notifier(audit_writer)

        # Notification channels
        notifier.register(NtfyChannel(topic="syris-f7k2mxqp94jw"))

        async def _pipeline(raw: RawInput) -> None:
            await run_pipeline(raw, normalizer, router, executor, responder, notifier=notifier, rules_engine=rules_engine)

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

        # Expose runtime components on app.state for API routes
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
        app.state.responder = responder
        app.state.notifier = notifier
        app.state.autonomy_service = autonomy_service
        app.state.task_engine = task_engine
        app.state.scheduler_loop = scheduler_loop
        app.state.watcher_loop = watcher_loop
        app.state.rules_engine = rules_engine
        app.state.context_builder = context_builder
        app.state.llm_client = llm_client

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
            "ControlPlane started run_id=%s env=%s", run_id, self._settings.env
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
        """Start the runtime and serve HTTP until shutdown signal."""
        await self.start()

        config = uvicorn.Config(
            self.app,
            host=self._settings.api_host,
            port=self._settings.api_port,
            log_level=self._settings.log_level.lower(),
            lifespan="off",
        )
        server = uvicorn.Server(config)

        try:
            await server.serve()
        finally:
            await self.stop()
