from typing import Any, Literal, Optional

from pydantic import BaseModel


class LLMRequest(BaseModel):
    """Input to the LLM provider — built by LLMClient from pipeline context."""

    system_prompt: str
    user_message: str
    tool_result_context: Optional[str] = None  # snippet from ExecutionResult, if relevant

    model_config = {"frozen": True}


class ToolCallFunction(BaseModel):
    """Function payload inside a model-emitted tool call."""

    name: str
    arguments: str  # JSON string as emitted by the model — not pre-parsed

    model_config = {"frozen": True}


class ToolCall(BaseModel):
    """A single tool invocation emitted by the model (OpenAI wire shape)."""

    id: str
    type: Literal["function"] = "function"
    function: ToolCallFunction

    model_config = {"frozen": True}


class ChatMessage(BaseModel):
    """Single message in a multi-turn conversation."""

    role: Literal["system", "user", "assistant", "tool"]
    content: Optional[str] = None
    tool_calls: Optional[list[ToolCall]] = None  # assistant-only
    tool_call_id: Optional[str] = None  # tool-only

    model_config = {"frozen": True}


class LLMChatRequest(BaseModel):
    """Multi-turn chat request carrying a full conversation history."""

    messages: list[ChatMessage]

    model_config = {"frozen": True}


class ToolFunctionSpec(BaseModel):
    """Function definition inside a ToolDefinition (OpenAI wire shape)."""

    name: str
    description: str
    parameters: dict[str, Any]  # JSON Schema from args_schema.model_json_schema()

    model_config = {"frozen": True}


class ToolDefinition(BaseModel):
    """OpenAI-format tool definition for providers that support native tool calls."""

    type: Literal["function"] = "function"
    function: ToolFunctionSpec

    model_config = {"frozen": True}


class LLMResponse(BaseModel):
    """Typed response returned by a provider and surfaced through the pipeline."""

    content: str
    model: str
    provider: str  # e.g. "sglang", "ollama"
    latency_ms: int
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    tool_iterations: Optional[int] = None  # number of round-trips when tool-calling
    thinking: Optional[str] = None  # extended thinking output, when supported by provider

    model_config = {"frozen": True}
