import logging

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.llm import LLMRequest, LLMResponse
from ..schemas.pipeline import ExecutionResult, RouteDecision
from .providers.base import BaseProvider

logger = logging.getLogger(__name__)


class LLMClient:
    """Single entry point for all LLM API calls inside SYRIS.

    Builds the prompt from pipeline context, delegates to the configured
    provider, and emits an audit event for every call.
    """

    def __init__(
        self,
        provider: BaseProvider,
        audit: AuditWriter,
        system_prompt: str,
    ) -> None:
        self._provider = provider
        self._audit = audit
        self._system_prompt = system_prompt

    async def respond(
        self,
        event: MessageEvent,
        decision: RouteDecision,
        result: ExecutionResult,
    ) -> LLMResponse:
        """Build a prompt from *event* + *result* and call the provider.

        Emits a single `stage="llm"` audit event with latency and outcome.
        """
        user_message = _build_user_message(event)
        tool_result_context = _build_tool_result_context(result)

        request = LLMRequest(
            system_prompt=self._system_prompt,
            user_message=user_message,
            tool_result_context=tool_result_context,
        )

        async with self._audit.span(
            event.trace_id,
            stage="llm",
            type="llm.response_completed",
            summary=f"LLM responding to event {event.event_id} from {event.source}",
            outcome="info",
            ref_event_id=event.event_id,
        ) as span:
            logger.info(
                "llm.response_completed event_id=%s",
                event.event_id,
            )
            llm_response = await self._provider.complete(request)
            span.outcome = "success"
            span.summary = (
                f"LLM response for event {event.event_id}: "
                f"{llm_response.content[:80]!r}"
            )

        logger.info(
            "llm.response_completed event_id=%s provider=%s model=%s latency_ms=%d",
            event.event_id,
            llm_response.provider,
            llm_response.model,
            llm_response.latency_ms,
        )
        return llm_response


def _build_user_message(event: MessageEvent) -> str:
    """Derive the user-turn text from a MessageEvent."""
    if isinstance(event.content, str):
        return event.content
    # Structured content — use a compact representation
    return str(event.content)


def _build_tool_result_context(result: ExecutionResult) -> str | None:
    """Include execution detail as context when it is meaningful."""
    if result.outcome.value in ("success", "failure"):
        return f"handler={result.handler} outcome={result.outcome.value} detail={result.detail}"
    return None
