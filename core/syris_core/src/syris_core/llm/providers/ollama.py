import json
import logging
import time
from typing import Any

import httpx

from ...schemas.llm import (
    ChatMessage,
    LLMChatRequest,
    LLMRequest,
    LLMResponse,
    ToolCall,
    ToolCallFunction,
    ToolDefinition,
)
from .base import BaseProvider, ToolRunner

logger = logging.getLogger(__name__)

_CHAT_PATH = "/v1/chat/completions"
_MAX_TOOL_ITERATIONS = 10


class OllamaProvider(BaseProvider):
    """Calls Ollama via its OpenAI-compatible HTTP API (available since v0.4).

    Ollama exposes POST /v1/chat/completions at the configured base URL
    with the same request/response shape as the OpenAI API. When *tools*
    and *tool_runner* are supplied to chat(), the provider runs a
    multi-turn tool-calling loop until the model returns a turn with no
    tool_calls (or _MAX_TOOL_ITERATIONS is reached).

    Note: not every Ollama model supports tool calling natively. Models
    that ignore the *tools* field will simply emit a normal reply, which
    terminates the loop after the first iteration — graceful degradation.
    """

    def __init__(self, base_url: str, model: str, timeout_s: int = 120) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout_s = timeout_s

    async def complete(self, request: LLMRequest) -> LLMResponse:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.user_message},
        ]
        if request.tool_result_context is not None:
            messages.append(
                {"role": "user", "content": f"[Tool result] {request.tool_result_context}"}
            )

        payload: dict[str, Any] = {"model": self._model, "messages": messages}

        t0 = time.monotonic()
        async with httpx.AsyncClient(timeout=self._timeout_s) as client:
            response = await client.post(
                f"{self._base_url}{_CHAT_PATH}", json=payload
            )
        latency_ms = int((time.monotonic() - t0) * 1_000)

        response.raise_for_status()
        data = response.json()

        content: str = data["choices"][0]["message"]["content"]
        usage: dict[str, Any] = data.get("usage", {})

        logger.debug(
            "ollama.complete model=%s latency_ms=%d", self._model, latency_ms
        )

        return LLMResponse(
            content=content,
            model=data.get("model", self._model),
            provider="ollama",
            latency_ms=latency_ms,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
        )

    async def chat(
        self,
        request: LLMChatRequest,
        *,
        tools: list[ToolDefinition] | None = None,
        tool_runner: ToolRunner | None = None,
    ) -> LLMResponse:
        """Multi-turn chat completion with optional tool-calling loop.

        When *tools* and *tool_runner* are both provided, runs the loop:
        send history → if assistant emits tool_calls, execute each via
        *tool_runner*, append assistant + tool messages to history, repeat
        — until a turn comes back without tool_calls. The final assistant
        turn is returned as the LLMResponse.
        """
        history: list[ChatMessage] = list(request.messages)
        total_latency_ms = 0
        last_usage: dict[str, Any] = {}
        last_model: str = self._model
        tool_calling_enabled = tools is not None and tool_runner is not None

        async with httpx.AsyncClient(timeout=self._timeout_s) as client:
            for iteration in range(1, _MAX_TOOL_ITERATIONS + 1):
                payload: dict[str, Any] = {
                    "model": self._model,
                    "messages": [_to_wire_message(m) for m in history],
                }
                if tool_calling_enabled:
                    payload["tools"] = [t.model_dump() for t in tools]  # type: ignore[union-attr]

                t0 = time.monotonic()
                response = await client.post(
                    f"{self._base_url}{_CHAT_PATH}", json=payload
                )
                total_latency_ms += int((time.monotonic() - t0) * 1_000)

                response.raise_for_status()
                data = response.json()

                msg = data["choices"][0]["message"]
                content: str | None = msg.get("content")
                tool_calls_raw: list[dict[str, Any]] | None = msg.get("tool_calls")
                last_usage = data.get("usage", {})
                last_model = data.get("model", self._model)

                parsed_tool_calls: list[ToolCall] | None = None
                if tool_calls_raw:
                    parsed_tool_calls = [
                        ToolCall(
                            id=tc["id"],
                            function=ToolCallFunction(
                                name=tc["function"]["name"],
                                arguments=tc["function"].get("arguments", "") or "",
                            ),
                        )
                        for tc in tool_calls_raw
                    ]

                history.append(
                    ChatMessage(
                        role="assistant",
                        content=content,
                        tool_calls=parsed_tool_calls,
                    )
                )

                if not tool_calls_raw or not tool_calling_enabled:
                    logger.debug(
                        "ollama.chat model=%s iterations=%d latency_ms=%d",
                        self._model, iteration, total_latency_ms,
                    )
                    return LLMResponse(
                        content=content or "",
                        model=last_model,
                        provider="ollama",
                        latency_ms=total_latency_ms,
                        prompt_tokens=last_usage.get("prompt_tokens"),
                        completion_tokens=last_usage.get("completion_tokens"),
                        tool_iterations=iteration,
                    )

                # Execute every tool call in this turn (sequential).
                assert tool_runner is not None  # narrowed by tool_calling_enabled
                for tc in tool_calls_raw:
                    tool_call_id = tc["id"]
                    tool_name = tc["function"]["name"]
                    raw_args = tc["function"].get("arguments", "") or ""

                    try:
                        args = json.loads(raw_args) if raw_args else {}
                    except json.JSONDecodeError as exc:
                        result_str = json.dumps(
                            {"error": "invalid_arguments_json", "message": str(exc)}
                        )
                    else:
                        result_str = await tool_runner(tool_name, args, tool_call_id)

                    history.append(
                        ChatMessage(
                            role="tool",
                            tool_call_id=tool_call_id,
                            content=result_str,
                        )
                    )

        # Safety net: model kept calling tools past the budget.
        logger.warning(
            "ollama.chat exceeded max tool iterations model=%s max=%d",
            self._model, _MAX_TOOL_ITERATIONS,
        )
        return LLMResponse(
            content="[LLM exceeded max tool-calling iterations]",
            model=last_model,
            provider="ollama",
            latency_ms=total_latency_ms,
            prompt_tokens=last_usage.get("prompt_tokens"),
            completion_tokens=last_usage.get("completion_tokens"),
            tool_iterations=_MAX_TOOL_ITERATIONS,
        )


def _to_wire_message(msg: ChatMessage) -> dict[str, Any]:
    """Serialize a ChatMessage into the OpenAI-compatible wire dict."""
    if msg.role == "assistant":
        out: dict[str, Any] = {"role": "assistant", "content": msg.content}
        if msg.tool_calls:
            out["tool_calls"] = [tc.model_dump() for tc in msg.tool_calls]
        return out
    if msg.role == "tool":
        return {
            "role": "tool",
            "tool_call_id": msg.tool_call_id,
            "content": msg.content,
        }
    return {"role": msg.role, "content": msg.content}
