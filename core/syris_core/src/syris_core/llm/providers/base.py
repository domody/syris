from abc import ABC, abstractmethod
from typing import Any, Awaitable, Callable

from ...schemas.llm import (
    LLMChatRequest,
    LLMRequest,
    LLMResponse,
    ToolDefinition,
)

# Closure that dispatches a model-requested tool call. Built per-request
# by LLMClient so it can capture trace_id and wrap ToolExecutor.
ToolRunner = Callable[[str, dict[str, Any], str], Awaitable[str]]


class BaseProvider(ABC):
    """Abstract base for LLM provider implementations.

    Each provider targets a specific runtime (SGLang, Ollama, etc.) but
    exposes the same methods so LLMClient stays provider-agnostic.
    """

    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send *request* to the provider and return a typed response."""

    async def chat(
        self,
        request: LLMChatRequest,
        *,
        tools: list[ToolDefinition] | None = None,
        tool_runner: ToolRunner | None = None,
    ) -> LLMResponse:
        """Multi-turn chat completion.

        Default implementation extracts the system prompt and last user
        message and delegates to complete() for backward compatibility.
        Providers should override this for native multi-turn support
        and tool calling. The base implementation ignores *tools* and
        *tool_runner*.
        """
        system_prompt = ""
        user_message = ""
        for msg in request.messages:
            if msg.role == "system" and msg.content is not None:
                system_prompt = msg.content
            elif msg.role == "user" and msg.content is not None:
                user_message = msg.content
        return await self.complete(
            LLMRequest(system_prompt=system_prompt, user_message=user_message)
        )
