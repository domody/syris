import logging
import time
from typing import Any

import httpx

from ...schemas.llm import LLMChatRequest, LLMRequest, LLMResponse, ToolDefinition
from .base import BaseProvider, ToolRunner

logger = logging.getLogger(__name__)

_CHAT_PATH = "/v1/chat/completions"


class SGLangProvider(BaseProvider):
    """Calls an SGLang server via its OpenAI-compatible HTTP API.

    SGLang exposes POST /v1/chat/completions with the same request/response
    shape as the OpenAI API, so no extra translation is needed.
    """

    def __init__(self, base_url: str, model: str, timeout_s: int = 30) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout_s = timeout_s

    async def complete(self, request: LLMRequest) -> LLMResponse:
        messages: list[dict[str, str]] = [
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
            "sglang.complete model=%s latency_ms=%d", self._model, latency_ms
        )

        return LLMResponse(
            content=content,
            model=data.get("model", self._model),
            provider="sglang",
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
        """Multi-turn chat completion with full message history.

        Tool calling is not yet implemented for SGLang — *tools* and
        *tool_runner* are accepted for interface parity but ignored.
        """
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
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
            "sglang.chat model=%s latency_ms=%d turns=%d",
            self._model, latency_ms, len(messages),
        )

        return LLMResponse(
            content=content,
            model=data.get("model", self._model),
            provider="sglang",
            latency_ms=latency_ms,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
        )
