"""
ToolRegistry — in-memory registry of available tools.

Tools are registered at startup via register(). After startup the registry
is effectively immutable for the lifetime of the process.
"""
import logging
from typing import Any, Callable, Coroutine, Iterator

from ..schemas.llm import ToolDefinition, ToolFunctionSpec
from .base import BaseTool, ToolDeps

logger = logging.getLogger(__name__)

# Protocol alias matching TaskEngine's StepHandler
StepHandler = Callable[[dict[str, Any]], Coroutine[Any, Any, dict[str, Any]]]


class ToolRegistry:
    """
    Registry of BaseTool subclasses, keyed by tool name.

    The registry holds *classes*, not instances. Instances are created
    on demand by ToolExecutor with a shared ToolDeps bundle.
    """

    def __init__(self) -> None:
        self._tools: dict[str, type[BaseTool]] = {}

    def register(self, tool_cls: type[BaseTool]) -> None:
        """Register a tool class. Raises ValueError on duplicate name."""
        name = tool_cls.name
        if name in self._tools:
            raise ValueError(
                f"Tool '{name}' already registered. "
                f"Existing: {self._tools[name].__qualname__}, "
                f"New: {tool_cls.__qualname__}"
            )
        self._tools[name] = tool_cls
        logger.info("tool.registered name=%s risk=%s", name, tool_cls.risk_level)

    def get(self, name: str) -> type[BaseTool] | None:
        """Return the tool class for name, or None."""
        return self._tools.get(name)

    def names(self) -> list[str]:
        """Return all registered tool names, sorted."""
        return sorted(self._tools.keys())

    def all_classes(self) -> Iterator[type[BaseTool]]:
        return iter(self._tools.values())

    def llm_tool_catalog(self) -> str:
        """
        Return a compact text block for LLM prompts.

        Format: name [risk] — description\\n  args: field*:type(desc), ...
        * = required, ? = optional.

        Upgrade path: when switching to native function calling, implement
        as_openai_tools() that iterates the same args_schema.model_json_schema()
        data — no changes to tool definitions needed.
        """
        lines: list[str] = ["Available tools:"]
        for name in self.names():
            cls = self._tools[name]
            schema = cls.args_schema.model_json_schema()
            props: dict = schema.get("properties", {})
            required: set[str] = set(schema.get("required", []))

            if props:
                arg_parts: list[str] = []
                for field_name, field_info in props.items():
                    ftype = field_info.get("type", "any")
                    if "anyOf" in field_info:
                        # Optional[X] → extract inner type
                        inner = next(
                            (t.get("type", "any") for t in field_info["anyOf"] if t.get("type") != "null"),
                            "any",
                        )
                        ftype = inner
                    desc = field_info.get("description", "")
                    marker = "*" if field_name in required else "?"
                    part = f"{field_name}{marker}:{ftype}"
                    if desc:
                        part += f"({desc})"
                    arg_parts.append(part)
                args_str = ", ".join(arg_parts)
            else:
                args_str = "no args"

            lines.append(f"  {name} [{cls.risk_level}] — {cls.description}")
            lines.append(f"    args: {args_str}")

        return "\n".join(lines)

    def llm_openai_tools(self) -> list[ToolDefinition]:
        """Return OpenAI-format tool definitions for native function calling."""
        return [
            ToolDefinition(
                function=ToolFunctionSpec(
                    name=cls.name,
                    description=cls.description,
                    parameters=cls.args_schema.model_json_schema(),
                )
            )
            for cls in (self._tools[n] for n in self.names())
        ]

    def llm_namespace_catalog(self) -> list[str]:
        """Return sorted unique namespace prefixes from all registered tool names.

        A namespace is the segment before the first dot in a tool name.
        Example: 'schedule.create', 'schedule.list', 'task.cancel' → ['schedule', 'task'].
        Used by LLMambiguityRouter to give the LLM a coarse capability surface
        without exposing full tool definitions.
        """
        namespaces: set[str] = set()
        for name in self._tools:
            dot_idx = name.find(".")
            namespaces.add(name[:dot_idx] if dot_idx > 0 else name)
        return sorted(namespaces)

    def as_step_handlers(self, deps: ToolDeps) -> dict[str, StepHandler]:
        """
        Build a dict[str, StepHandler] for TaskEngine injection.

        Each handler wraps a tool instance: async (dict) -> dict.
        Gate checking is NOT performed here — StepRunner owns that gate.
        """
        from .executor import ToolExecutor

        executor = ToolExecutor(self, deps, gate_checker=None)
        return {name: executor.make_step_handler(name) for name in self._tools}
