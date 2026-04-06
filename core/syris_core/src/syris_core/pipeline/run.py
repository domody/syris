import logging
from typing import Optional

from ..rules.engine import RulesEngine
from ..schemas.events import RawInput
from ..schemas.pipeline import IngestResponse
from .executor import Executor
from .normalizer import Normalizer
from .responder import Responder
from .router import Router

logger = logging.getLogger(__name__)


async def run_pipeline(
    raw: RawInput,
    normalizer: Normalizer,
    router: Router,
    executor: Executor,
    responder: Responder,
    rules_engine: Optional[RulesEngine] = None,
) -> IngestResponse:
    """Normalize → (Rules) → Route → Execute → Respond.

    Each stage is independently testable. The orchestrator does not contain
    business logic — it sequences stage calls and lets exceptions propagate.
    rules_engine is optional; when None the rules stage is skipped entirely,
    keeping all existing tests passing without modification.
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
    reply = await responder.respond(event, decision, result)
    return IngestResponse(execution=result, reply=reply)
