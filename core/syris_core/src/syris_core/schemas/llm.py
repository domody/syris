from typing import Optional

from pydantic import BaseModel


class LLMRequest(BaseModel):
    """Input to the LLM provider — built by LLMClient from pipeline context."""

    system_prompt: str
    user_message: str
    tool_result_context: Optional[str] = None  # snippet from ExecutionResult, if relevant

    model_config = {"frozen": True}


class LLMResponse(BaseModel):
    """Typed response returned by a provider and surfaced through the pipeline."""

    content: str
    model: str
    provider: str  # e.g. "sglang", "ollama"
    latency_ms: int
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None

    model_config = {"frozen": True}
