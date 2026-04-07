import logging
import time
from typing import Any

import httpx

from ...schemas.llm import LLMChatRequest, LLMRequest, LLMResponse
from .base import BaseProvider

logger = logging.getLogger(__name__)

_CHAT_PATH = "/v1/chat/completions"


class OllamaProvider(BaseProvider):
    """Calls Ollama via its OpenAI-compatible HTTP API (available since v0.4).

    Ollama exposes POST /v1/chat/completions at the configured base URL
    with the same request/response shape as the OpenAI API.
    """

    def __init__(self, base_url: str, model: str, timeout_s: int = 120) -> None:
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

    async def chat(self, request: LLMChatRequest) -> LLMResponse:
        """Multi-turn chat completion with full message history."""
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
            "ollama.chat model=%s latency_ms=%d turns=%d",
            self._model, latency_ms, len(messages),
        )

        return LLMResponse(
            content=content,
            model=data.get("model", self._model),
            provider="ollama",
            latency_ms=latency_ms,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
        )
