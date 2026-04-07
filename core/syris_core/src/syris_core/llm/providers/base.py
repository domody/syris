from abc import ABC, abstractmethod

from ...schemas.llm import LLMChatRequest, LLMRequest, LLMResponse


class BaseProvider(ABC):
    """Abstract base for LLM provider implementations.

    Each provider targets a specific runtime (SGLang, Ollama, etc.) but
    exposes the same methods so LLMClient stays provider-agnostic.
    """

    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send *request* to the provider and return a typed response."""

    async def chat(self, request: LLMChatRequest) -> LLMResponse:
        """Multi-turn chat completion.

        Default implementation extracts the system prompt and last user
        message and delegates to complete() for backward compatibility.
        Providers should override this for native multi-turn support.
        """
        system_prompt = ""
        user_message = ""
        for msg in request.messages:
            if msg.role == "system":
                system_prompt = msg.content
            elif msg.role == "user":
                user_message = msg.content
        return await self.complete(
            LLMRequest(system_prompt=system_prompt, user_message=user_message)
        )
