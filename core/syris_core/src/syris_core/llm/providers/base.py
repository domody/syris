from abc import ABC, abstractmethod

from ...schemas.llm import LLMRequest, LLMResponse


class BaseProvider(ABC):
    """Abstract base for LLM provider implementations.

    Each provider targets a specific runtime (SGLang, Ollama, etc.) but
    exposes the same single method so LLMClient stays provider-agnostic.
    """

    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send *request* to the provider and return a typed response."""
