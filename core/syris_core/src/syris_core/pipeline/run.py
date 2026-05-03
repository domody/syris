import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..memory.significance import score_event
from ..observability.audit import AuditWriter
from ..rules.engine import RulesEngine
from ..notifications.notifier import Notifier
from ..schemas.events import MessageEvent, RawInput
from ..schemas.pipeline import ExecutionResult, IngestResponse
from ..storage.db import session_scope
from ..storage.repos.events import EventRepo
from .executor import Executor
from .normalizer import Normalizer
from .responder import Responder
from .router import Router

logger = logging.getLogger(__name__)

CHAT_SOURCES: frozenset[str] = frozenset({"api.syris.chat"})


def _should_enrich_inbound(result: ExecutionResult) -> bool:
    """Return True when the execution involved a tool call.

    TODO: derive from result once ExecutionResult exposes tool_was_invoked.
    """
    return False


async def _score_reply_and_persist(
    reply_event: MessageEvent,
    session_maker: async_sessionmaker[AsyncSession],
    audit: Optional[AuditWriter],
) -> None:
    """Score a reply event and persist its significance fields.

    tool_invoked defaults to False until ExecutionResult exposes the flag.
    TODO: pass tool_invoked=True when caller can derive it from ExecutionResult.
    """
    sig = score_event(reply_event.content, reply_event.source, reply_event.structured)
    async with session_scope(session_maker) as session:
        await EventRepo(session).update_significance(reply_event.event_id, sig)
    if audit is not None:
        await audit.emit(
            reply_event.trace_id,
            stage="memory",
            type="memory.scored",
            summary=(
                f"Scored reply {reply_event.event_id}: {sig.score:.2f} "
                f"tags=[{', '.join(sig.tags)}] anchor={sig.is_anchor}"
            ),
            outcome="info",
            ref_event_id=reply_event.event_id,
        )


async def run_pipeline(
    raw: RawInput,
    normalizer: Normalizer,
    router: Router,
    executor: Executor,
    responder: Responder,
    notifier: Optional[Notifier] = None,
    rules_engine: Optional[RulesEngine] = None,
    session_maker: Optional[async_sessionmaker[AsyncSession]] = None,
    audit: Optional[AuditWriter] = None,
) -> IngestResponse:
    """Normalize → (Rules) → Route → Execute → Respond.

    Each stage is independently testable. The orchestrator does not contain
    business logic — it sequences stage calls and lets exceptions propagate.
    rules_engine is optional; when None the rules stage is skipped entirely,
    keeping all existing tests passing without modification.

    session_maker and audit are optional; when provided, reply events are
    significance-scored in a third session scope after the responder returns.
    """
    event = await normalizer.normalize(raw)

    if rules_engine is not None:
        try:
            await rules_engine.evaluate(event)
        except Exception:
            logger.exception(
                "rules_engine.evaluate failed event_id=%s — continuing", event.event_id
            )

    decision = await router.route(event)
    result = await executor.execute(decision, event)

    if event.source in CHAT_SOURCES:
        thinking, reply, reply_event = await responder.respond(event, result)

        if session_maker is not None:
            await _score_reply_and_persist(reply_event, session_maker, audit)

        # TODO: re-score inbound event with tool_invoked=True once
        # _should_enrich_inbound() is implemented.
        if session_maker is not None and _should_enrich_inbound(result):
            sig = score_event(
                event.content, event.source, event.structured, tool_invoked=True
            )
            async with session_scope(session_maker) as session:
                await EventRepo(session).update_significance(event.event_id, sig)
    else:
        thinking, reply = None, None

    if notifier is not None:
        try:
            await notifier.notify(event, decision, result)
        except Exception:
            logger.exception(
                "notifer.notify failed event_id=%s — continuing", event.event_id
            )

    return IngestResponse(execution=result, reply=reply, thinking=thinking)
