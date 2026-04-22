import json
import logging
import time
from typing import Any

from cerebras.cloud.sdk import AsyncCerebras

from ...schemas.llm import (
    ChatMessage,
    LLMChatRequest,
    LLMRequest,
    LLMResponse,
    ToolDefinition,
)
from .base import BaseProvider, ToolRunner

logger = logging.getLogger(__name__)

_MAX_TOOL_ITERATIONS = 10


class CerebrasProvider(BaseProvider):
    """Calls Cerebras Cloud via the official cerebras-cloud-sdk (AsyncCerebras).

    Reads CEREBRAS_API_KEY from the environment automatically. Supports the
    full tool-calling loop — up to _MAX_TOOL_ITERATIONS rounds. Note that
    Cerebras uses max_completion_tokens (not max_tokens) for output length.
    """

    def __init__(self, model: str, timeout_s: int = 30) -> None:
        self._model = model
        self._timeout_s = timeout_s
        self._client = AsyncCerebras()

    async def complete(self, request: LLMRequest) -> LLMResponse:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.user_message},
        ]
        if request.tool_result_context is not None:
            messages.append(
                {"role": "user", "content": f"[Tool result] {request.tool_result_context}"}
            )

        t0 = time.monotonic()
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            timeout=self._timeout_s,
        )
        latency_ms = int((time.monotonic() - t0) * 1_000)

        content: str = response.choices[0].message.content or ""
        usage = response.usage

        logger.debug("cerebras.complete model=%s latency_ms=%d", self._model, latency_ms)

        return LLMResponse(
            content=content,
            model=response.model or self._model,
            provider="cerebras",
            latency_ms=latency_ms,
            prompt_tokens=usage.prompt_tokens if usage else None,
            completion_tokens=usage.completion_tokens if usage else None,
        )

    async def chat(
        self,
        request: LLMChatRequest,
        *,
        tools: list[ToolDefinition] | None = None,
        tool_runner: ToolRunner | None = None,
    ) -> LLMResponse:
        """Multi-turn chat completion with optional tool-calling loop."""
        history: list[dict[str, Any]] = [_to_wire(m) for m in request.messages]
        total_latency_ms = 0
        last_usage: Any = None
        last_model: str = self._model
        tool_calling_enabled = tools is not None and tool_runner is not None

        for iteration in range(1, _MAX_TOOL_ITERATIONS + 1):
            kwargs: dict[str, Any] = {
                "model": self._model,
                "messages": list(history),
                "timeout": self._timeout_s,
            }
            if tool_calling_enabled:
                kwargs["tools"] = [t.model_dump() for t in tools]  # type: ignore[union-attr]

            t0 = time.monotonic()
            response = await self._client.chat.completions.create(**kwargs)
            total_latency_ms += int((time.monotonic() - t0) * 1_000)

            msg = response.choices[0].message
            content: str | None = msg.content
            tool_calls_raw = msg.tool_calls
            last_usage = response.usage
            last_model = response.model or self._model

            assistant_turn: dict[str, Any] = {"role": "assistant", "content": content}
            if tool_calls_raw:
                assistant_turn["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls_raw
                ]
            history.append(assistant_turn)

            if not tool_calls_raw or not tool_calling_enabled:
                logger.debug(
                    "cerebras.chat model=%s iterations=%d latency_ms=%d",
                    self._model, iteration, total_latency_ms,
                )
                return LLMResponse(
                    content=content or "",
                    model=last_model,
                    provider="cerebras",
                    latency_ms=total_latency_ms,
                    prompt_tokens=last_usage.prompt_tokens if last_usage else None,
                    completion_tokens=last_usage.completion_tokens if last_usage else None,
                    tool_iterations=iteration,
                )

            assert tool_runner is not None
            for tc in tool_calls_raw:
                raw_args = tc.function.arguments or ""
                try:
                    args = json.loads(raw_args) if raw_args else {}
                except json.JSONDecodeError as exc:
                    result_str = json.dumps(
                        {"error": "invalid_arguments_json", "message": str(exc)}
                    )
                else:
                    result_str = await tool_runner(tc.function.name, args, tc.id)

                history.append(
                    {"role": "tool", "tool_call_id": tc.id, "content": result_str}
                )

        logger.warning(
            "cerebras.chat exceeded max tool iterations model=%s max=%d",
            self._model, _MAX_TOOL_ITERATIONS,
        )
        return LLMResponse(
            content="[LLM exceeded max tool-calling iterations]",
            model=last_model,
            provider="cerebras",
            latency_ms=total_latency_ms,
            prompt_tokens=last_usage.prompt_tokens if last_usage else None,
            completion_tokens=last_usage.completion_tokens if last_usage else None,
            tool_iterations=_MAX_TOOL_ITERATIONS,
        )


def _to_wire(msg: ChatMessage) -> dict[str, Any]:
    """Serialize a ChatMessage into the OpenAI-compatible wire dict."""
    if msg.role == "assistant":
        out: dict[str, Any] = {"role": "assistant", "content": msg.content}
        if msg.tool_calls:
            out["tool_calls"] = [tc.model_dump() for tc in msg.tool_calls]
        return out
    if msg.role == "tool":
        return {"role": "tool", "tool_call_id": msg.tool_call_id, "content": msg.content}
    return {"role": msg.role, "content": msg.content}
