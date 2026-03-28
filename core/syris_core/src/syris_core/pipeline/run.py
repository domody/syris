import logging

from ..schemas.events import RawInput
from ..schemas.pipeline import ExecutionResult
from .executor import Executor
from .normalizer import Normalizer
from .router import Router
from.responder import Responder

logger = logging.getLogger(__name__)


async def run_pipeline(
    raw: RawInput,
    normalizer: Normalizer,
    router: Router,
    executor: Executor,
    responder: Responder
) -> ExecutionResult:
    """Normalize → Route → Execute.

    Each stage is independently testable. The orchestrator does not contain
    business logic — it sequences stage calls and lets exceptions propagate.
    """
    event = await normalizer.normalize(raw)
    decision = await router.route(event)
    result = await executor.execute(decision, event)

    # TODO:
    response = await responder.respond(event, decision, result)
    
    return result
