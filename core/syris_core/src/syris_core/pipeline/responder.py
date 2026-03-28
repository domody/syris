import logging

from ..llm.client import LLMClient
from ..schemas.events import MessageEvent
from ..schemas.llm import LLMResponse
from ..schemas.pipeline import ExecutionResult, RouteDecision

logger = logging.getLogger(__name__)


class Responder:
    """Generates an LLM response for events routed to response_mode="llm_response".

    Delegates entirely to LLMClient — all prompt building, provider calls,
    and audit emission happen there.
    """

    def __init__(self, client: LLMClient) -> None:
        self._client = client

    async def respond(
        self,
        event: MessageEvent,
        decision: RouteDecision,
        result: ExecutionResult,
    ) -> LLMResponse:
        return await self._client.respond(event, decision, result)
