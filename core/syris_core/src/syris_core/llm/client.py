import json
import logging
from typing import Any
from uuid import UUID

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


    async def chat(self, content: str, trace_id: UUID) -> LLMResponse:
        """Conversational LLM call — no tool selection, no execution context.

        This is the entry point for the llm_conversation pipeline handler.
        Later it will become the agentic loop (tool calls, multi-turn, etc.).
        """
        request = LLMRequest(
            system_prompt=self._system_prompt,
            user_message=content,
        )

        async with self._audit.span(
            trace_id,
            stage="llm",
            type="llm.conversation",
            summary=f"LLM conversation: {content[:80]!r}",
            outcome="info",
        ) as span:
            logger.info("llm.conversation trace_id=%s", trace_id)
            llm_response = await self._provider.complete(request)
            span.outcome = "success"
            span.summary = f"LLM conversation reply: {llm_response.content[:80]!r}"

        logger.info(
            "llm.conversation trace_id=%s provider=%s model=%s latency_ms=%d",
            trace_id,
            llm_response.provider,
            llm_response.model,
            llm_response.latency_ms,
        )
        return llm_response

    async def classify_intent(
        self,
        event: MessageEvent,
        known_handlers: list[str],
    ) -> str:
        """Classify the intent of *event* into a registered handler name.

        Uses a minimal routing prompt — separate from the conversational
        response prompt. Returns 'unroutable' if no handler fits.
        """
        handlers_list = "\n".join(f"  {h}" for h in sorted(known_handlers))
        system = (
            "You are an intent classifier for an automation system.\n"
            "Given a user message, pick the single best handler from the list below.\n"
            "Reply with ONLY the handler name — no explanation, no punctuation.\n"
            "If nothing fits, reply with: unroutable\n\n"
            f"Handlers:\n{handlers_list}"
        )
        user_msg = event.content or str(event.structured)
        request = LLMRequest(system_prompt=system, user_message=user_msg)

        async with self._audit.span(
            event.trace_id,
            stage="llm",
            type="llm.intent_classified",
            summary=f"LLM classifying intent for event {event.event_id}",
            outcome="info",
            ref_event_id=event.event_id,
        ) as span:
            logger.info("llm.classify_intent event_id=%s", event.event_id)
            response = await self._provider.complete(request)
            raw = response.content.strip().lower()
            handler = raw if raw in known_handlers else "unroutable"
            span.outcome = "success"
            span.summary = (
                f"LLM classified intent as '{handler}' for event {event.event_id}"
            )

        logger.info(
            "llm.intent_classified event_id=%s handler=%s",
            event.event_id,
            handler,
        )
        return handler

    async def decide_step_tool(
        self,
        trace_id: UUID,
        goal: str,
        available_tools: list[str],
        context: str = "",
        tool_catalog: str = "",
    ) -> tuple[str, dict[str, Any]]:
        """Ask the LLM which tool to invoke next for a task step.

        Returns ``(tool_name, input_payload)``. ``tool_name`` will be
        ``'unknown'`` if the LLM response cannot be parsed or the tool is
        not in *available_tools*.

        When *tool_catalog* is provided it is used in the system prompt
        instead of a bare list of names, giving the LLM descriptions and
        arg schemas for each tool.
        """
        if tool_catalog:
            tools_section = tool_catalog
        else:
            tools_section = "Available tools:\n" + "\n".join(
                f"  {t}" for t in sorted(available_tools)
            )
        context_section = f"\nContext:\n{context}\n" if context else ""
        system = (
            "You are a task planner for an automation system.\n"
            "Select the best tool from the list and return a JSON input payload.\n"
            "Reply with ONLY valid JSON:\n"
            '{"tool": "<tool_name>", "input": {}}\n\n'
            f"{tools_section}"
        )
        user_msg = f"Goal: {goal}{context_section}"
        request = LLMRequest(system_prompt=system, user_message=user_msg)

        async with self._audit.span(
            trace_id,
            stage="llm",
            type="llm.step_decided",
            summary=f"LLM deciding tool for goal: {goal[:80]}",
            outcome="info",
        ) as span:
            logger.info("llm.decide_step_tool trace_id=%s goal=%s", trace_id, goal[:80])
            response = await self._provider.complete(request)
            content = response.content.strip()
            span.outcome = "success"
            span.summary = f"LLM step decision: {content[:80]}"

        try:
            data = json.loads(content)
            tool_name: str = data.get("tool", "unknown")
            input_payload: dict[str, Any] = data.get("input", {})
        except (json.JSONDecodeError, AttributeError):
            tool_name = "unknown"
            input_payload = {}

        if tool_name not in available_tools:
            tool_name = "unknown"

        logger.info(
            "llm.step_decided trace_id=%s tool=%s", trace_id, tool_name
        )
        return tool_name, input_payload


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
