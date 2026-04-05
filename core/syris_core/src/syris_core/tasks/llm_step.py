"""
LLM-powered step handler for ``tool_name = "llm_decide"``.

When a task step is created with ``tool_name="llm_decide"``, the task engine
dispatches it to this handler. The handler asks the LLM to select the next
tool and returns an output_payload describing the decision.

Expected input_payload keys
---------------------------
- ``goal``            (str, required)  — what the step should accomplish
- ``context``         (str, optional)  — additional context for the LLM
- ``trace_id``        (str, optional)  — parent trace_id for audit correlation;
                                         falls back to a fresh UUID

Output payload keys
-------------------
- ``selected_tool``   (str)            — the handler name chosen by the LLM,
                                         or ``"unknown"`` if none could be selected
- ``tool_input``      (dict)           — suggested input_payload for that tool
- ``reason``          (str)            — brief free-text reason from the LLM
"""
import logging
import uuid
from typing import Any

from ..llm.client import LLMClient
from ..tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


class LLMDecideHandler:
    """Step handler that delegates tool selection to the LLM.

    Registered in the task engine handler dict under the key ``"llm_decide"``.
    The available tool list and catalog are derived from the ToolRegistry at
    call time, so newly registered tools are automatically visible.
    """

    def __init__(
        self,
        llm_client: LLMClient,
        tool_registry: ToolRegistry,
    ) -> None:
        self._llm = llm_client
        self._registry = tool_registry

    async def __call__(self, input_payload: dict[str, Any]) -> dict[str, Any]:
        goal: str = input_payload.get("goal", "")
        if not goal:
            raise ValueError("llm_decide step requires 'goal' in input_payload")

        context: str = input_payload.get("context", "")

        trace_id_raw = input_payload.get("_trace_id") or input_payload.get("trace_id")
        try:
            trace_id = uuid.UUID(str(trace_id_raw)) if trace_id_raw else uuid.uuid4()
        except (ValueError, AttributeError):
            trace_id = uuid.uuid4()

        tools = self._registry.names()
        catalog = self._registry.llm_tool_catalog()

        selected_tool, tool_input = await self._llm.decide_step_tool(
            trace_id=trace_id,
            goal=goal,
            available_tools=tools,
            context=context,
            tool_catalog=catalog,
        )

        logger.info(
            "llm_decide.resolved goal=%s selected_tool=%s",
            goal[:80],
            selected_tool,
        )

        return {
            "selected_tool": selected_tool,
            "tool_input": tool_input,
            "reason": f"LLM selected '{selected_tool}' for goal: {goal[:120]}",
        }
