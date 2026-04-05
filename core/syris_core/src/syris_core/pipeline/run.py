import logging

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
) -> IngestResponse:
    """Normalize → Route → Execute → Respond.

    Each stage is independently testable. The orchestrator does not contain
    business logic — it sequences stage calls and lets exceptions propagate.
    """
    event = await normalizer.normalize(raw)
    decision = await router.route(event)
    result = await executor.execute(decision, event)
    reply = await responder.respond(event, decision, result)
    return IngestResponse(execution=result, reply=reply)
