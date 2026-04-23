import json
import logging

from pydantic import ValidationError

from ..llm.providers.base import BaseProvider
from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.llm import LLMRequest
from ..schemas.pipeline import AmbiguityDecision, LLMRoutingDecision
from ..tools.registry import ToolRegistry
from .prompts import build_ambiguity_prompt

logger = logging.getLogger(__name__)


class LLMambiguityRouter:
    """Coarse LLM-powered router for non-chat source events.

    Accepts a MessageEvent from a non-chat source (scheduler tick, watcher alert,
    webhook, etc.) and produces an LLMRoutingDecision by issuing a single, stateless
    LLM completion. Intended for use after rule-based routing has been exhausted.

    How it works
    ------------
    1. Calls registry.llm_namespace_catalog() to obtain the current set of
       registered capability namespaces (e.g. ['approval', 'schedule', 'task']).
    2. Builds a system prompt via routing.prompts.build_ambiguity_prompt() with
       the namespace list injected — the LLM receives namespaces only, not full
       tool definitions, to avoid context-stuffing.
    3. Issues a single provider.complete() call (no chat history, no tool calling).
    4. Parses the JSON response into an LLMRoutingDecision. On any parse failure
       the fallback is ESCALATE with confidence=0.0 so the caller handles ambiguity
       safely.
    5. Emits one audit span (stage="route", type="routing.llm_ambiguity").

    Second-stage resolver
    ---------------------
    A tool_call decision includes only the target namespace. A downstream second-stage
    resolver (not implemented here) is responsible for receiving the relevant
    namespace's full tool definitions and resolving the decision to a specific tool
    name and input payload.

    What this class does NOT do
    ---------------------------
    - Does not execute tools or dispatch to handlers.
    - Does not maintain or load chat history.
    - Does not use the provider's native function-calling API.
    - Does not resolve a tool_call decision to a specific tool.
    - Does not send notifications or handle escalations.
    """

    def __init__(
        self,
        provider: BaseProvider,
        audit: AuditWriter,
        registry: ToolRegistry,
    ) -> None:
        self._provider = provider
        self._audit = audit
        self._registry = registry

    async def route(self, event: MessageEvent) -> LLMRoutingDecision:
        """Classify *event* into a coarse LLMRoutingDecision.

        On LLM or parse failure returns a safe fallback: ESCALATE with confidence=0.0.
        The audit span is always emitted regardless of success or failure.
        """
        namespaces = self._registry.llm_namespace_catalog()
        system = build_ambiguity_prompt(namespaces)
        user_message = event.content or str(event.structured)
        request = LLMRequest(system_prompt=system, user_message=user_message)

        async with self._audit.span(
            event.trace_id,
            stage="route",
            type="routing.llm_ambiguity",
            summary=f"LLM ambiguity routing for event {event.event_id}",
            outcome="info",
            ref_event_id=event.event_id,
        ) as span:
            logger.info(
                "llm_ambiguity.route event_id=%s namespaces=%s",
                event.event_id,
                namespaces,
            )
            response = await self._provider.complete(request)
            decision = _parse_decision(response.content)
            span.outcome = "success"
            span.summary = (
                f"LLM ambiguity decision={decision.decision.value} "
                f"namespace={decision.namespace} "
                f"confidence={decision.confidence:.2f} "
                f"for event {event.event_id}"
            )

        logger.info(
            "llm_ambiguity.decided event_id=%s decision=%s namespace=%s confidence=%.2f",
            event.event_id,
            decision.decision.value,
            decision.namespace,
            decision.confidence,
        )
        return decision


def _parse_decision(content: str) -> LLMRoutingDecision:
    """Parse a raw LLM response string into an LLMRoutingDecision.

    Attempts JSON decode then Pydantic validation. On any failure returns a
    safe escalate fallback with the truncated raw content embedded in reason
    for debuggability.
    """
    try:
        data = json.loads(content)
        return LLMRoutingDecision(
            decision=data["decision"],
            namespace=data.get("namespace"),
            reason=str(data.get("reason", "")),
            confidence=max(0.0, min(1.0, float(data.get("confidence", 0.0)))),
        )
    except (json.JSONDecodeError, KeyError, TypeError, ValueError, ValidationError) as exc:
        truncated = content[:200].replace("\n", " ")
        logger.warning(
            "llm_ambiguity.parse_failed exc=%s raw=%r", type(exc).__name__, truncated
        )
        return LLMRoutingDecision(
            decision=AmbiguityDecision.ESCALATE,
            namespace=None,
            reason=f"parse_failed: {type(exc).__name__} — raw: {truncated!r}",
            confidence=0.0,
        )
