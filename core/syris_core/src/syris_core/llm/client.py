import json
import logging
from collections import OrderedDict
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID

if TYPE_CHECKING:
    from ..tools.executor import ToolExecutor
    from ..tools.registry import ToolRegistry
    from .context import ContextBuilder

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.llm import (
    ChatMessage,
    LLMChatRequest,
    LLMRequest,
    LLMResponse,
    ToolDefinition,
)
from ..schemas.pipeline import ExecutionOutcome, ExecutionResult
from ..tools.executor import (
    ToolGatedError,
    ToolNotFoundError,
    ToolValidationError,
)
from .providers.base import BaseProvider, ToolRunner

logger = logging.getLogger(__name__)

_MAX_CONTEXT_CACHE = 100


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
        context_builder: Optional["ContextBuilder"] = None,
        tool_executor: Optional["ToolExecutor"] = None,
        tool_registry: Optional["ToolRegistry"] = None,
    ) -> None:
        self._provider = provider
        self._audit = audit
        self._system_prompt = system_prompt
        self._context_builder = context_builder
        self._tool_executor = tool_executor
        self._tool_registry = tool_registry
        # Bounded cache of recent context bundles for the debug endpoint
        self._last_context: OrderedDict[UUID, Any] = OrderedDict()

    async def chat(
        self,
        event: MessageEvent,
        result: Optional[ExecutionResult] = None,
    ) -> LLMResponse:
        """Conversational LLM call with thread-scoped context.

        Always uses the ContextBuilder for multi-turn history when available.
        When *result* is provided and represents a completed execution (success
        or failure), it is appended to the current user turn so the LLM can
        reference what the system just did. Falls back to single-turn when no
        context builder is configured.
        """
        content = event.content or str(event.structured)
        trace_id = event.trace_id
        result_context = _build_result_context(result)

        if self._context_builder is not None:
            bundle = await self._context_builder.build(event)
            messages = self._context_builder.to_messages(bundle)

            if result_context:
                last = messages[-1]
                messages[-1] = ChatMessage(
                    role=last.role,
                    content=f"{last.content}\n\n[Execution: {result_context}]",
                )

            chat_request = LLMChatRequest(messages=messages)
            tools_list, tool_runner_fn = self._build_tool_calling(trace_id)

            async with self._audit.span(
                trace_id,
                stage="llm",
                type="llm.conversation",
                summary=f"LLM conversation (multi-turn): {content[:80]!r}",
                outcome="info",
            ) as span:
                logger.info(
                    "llm.conversation trace_id=%s thread_id=%s turns=%d",
                    trace_id, event.thread_id, len(bundle.conversation_history),
                )
                llm_response = await self._provider.chat(
                    chat_request, tools=tools_list, tool_runner=tool_runner_fn,
                )
                span.outcome = "success"
                span.summary = (
                    f"LLM conversation reply "
                    f"({llm_response.tool_iterations or 0} tool rounds): "
                    f"{llm_response.content[:80]!r}"
                )

            self._last_context[trace_id] = bundle
            if len(self._last_context) > _MAX_CONTEXT_CACHE:
                self._last_context.popitem(last=False)
        else:
            user_message = content
            if result_context:
                user_message = f"{content}\n\n[Execution: {result_context}]"

            request = LLMRequest(
                system_prompt=self._system_prompt,
                user_message=user_message,
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

    def get_cached_context(self, trace_id: UUID) -> Any:
        """Return the cached ContextBundle for a trace_id, or None."""
        return self._last_context.get(trace_id)

    def _build_tool_calling(
        self,
        trace_id: UUID,
    ) -> tuple[list[ToolDefinition] | None, ToolRunner | None]:
        """Build the tools list + per-request tool_runner closure.

        Returns (None, None) when the executor or registry are not wired —
        the provider then runs as plain chat. Otherwise the closure
        captures *trace_id*, dispatches through the gated ToolExecutor,
        and coerces every failure mode into a JSON tool message so the
        provider loop never aborts mid-turn.
        """
        if self._tool_executor is None or self._tool_registry is None:
            return None, None

        tools_list = self._tool_registry.llm_openai_tools()
        executor = self._tool_executor

        async def _run_tool(
            name: str, args: dict[str, Any], tool_call_id: str
        ) -> str:
            idem = f"llm:{trace_id}:{tool_call_id}"
            try:
                result = await executor.execute(
                    name, args, trace_id=trace_id, idempotency_key=idem,
                )
                return json.dumps(
                    {"summary": result.summary, "data": result.data},
                    default=str,
                )
            except ToolGatedError as exc:
                return json.dumps(
                    {"error": "gated", "action": exc.gate_action, "message": str(exc)}
                )
            except ToolNotFoundError as exc:
                return json.dumps(
                    {"error": "tool_not_found", "message": str(exc)}
                )
            except ToolValidationError as exc:
                return json.dumps(
                    {"error": "validation_failed", "message": str(exc)}
                )
            except Exception as exc:
                logger.exception("tool_runner unexpected failure tool=%s", name)
                return json.dumps({"error": "unexpected", "message": str(exc)})

        return tools_list, _run_tool

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


def _build_result_context(result: Optional[ExecutionResult]) -> str | None:
    """Return a short execution summary when the result is meaningful."""
    if result is None:
        return None
    if result.outcome in (ExecutionOutcome.SUCCESS, ExecutionOutcome.FAILURE):
        return f"handler={result.handler} outcome={result.outcome.value} detail={result.detail}"
    return None
