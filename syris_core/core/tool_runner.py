import asyncio
import inspect
from pydantic import BaseModel
from typing import Any, Callable

from syris_core.types.llm import ToolArgs
from syris_core.util.helpers import normalize_message_content


class ToolCallResult(BaseModel):
    tool_name: str
    result: Any
    tool_message: dict


class ToolRunner:
    def __init__(self, tool_registry: dict[str, dict], *, max_concurency: int = 8):
        self._registry = tool_registry
        self._sem = asyncio.Semaphore(max_concurency)

    async def run_tools(
        self, tool_names: list[str], args: ToolArgs
    ) -> tuple[dict[str, Any], list[dict]]:
        tasks: list[asyncio.Task[ToolCallResult]] = []

        for tool_name in tool_names:
            if not tool_name:
                continue
            tasks.append(
                asyncio.create_task(self._run_one(tool_name=tool_name, args=args.arguments))
            )

        done: list[ToolCallResult] = await asyncio.gather(*tasks)

        results: dict[str, Any] = {}
        tool_messages: list[dict] = []

        for item in done:
            results[item.tool_name] = item.result
            tool_messages.append(item.tool_message)

        return results, tool_messages

    async def _run_one(self, tool_name: str, args: Any) -> ToolCallResult:
        entry = self._registry.get(tool_name)
        if not entry:
            msg = {"role": "tool", "tool_name": tool_name, "content": "Tool not found."}
            return ToolCallResult(
                tool_name=tool_name, result="Tool not found.", tool_message=msg
            )

        func: Callable[..., Any] = entry["func"]

        tool_args = args.get(tool_name, {}) if isinstance(args, dict) else args
        if tool_args is None:
            tool_args = {}

        async with self._sem:

            try:
                if inspect.iscoroutinefunction(func):
                    result = await func(**tool_args)
                else:
                    result = await asyncio.to_thread(func, **tool_args)
            except Exception as e:
                result = f"Tool error: {type(e).__name__}: {e}"

        msg = {
            "role": "tool",
            "tool_name": tool_name,
            "content": normalize_message_content(result),
        }
        return ToolCallResult(tool_name=tool_name, result=result, tool_message=msg)
