from collections import deque

from typing import Any
from syris_core.types.memory import MemorySnapshot

# Improvement plan:
#  - Assign each message a relevance score, and only store top K most relevant messages
#  - Track threads based on convo topic. If conversation moves, switch thread.
#  - Hybring working memory containing: immediate messages, thread context, system state, relevant semantic recalls.
#  - When a thread goes stale, summarize contents and relevant points, archive to relevant stores, remove.

class WorkingMemory:
    def __init__(self, max_messages: int = 8):
        self.max_messages = max_messages
        self._buffers: dict[str, deque] = {
            "chat": deque(maxlen = max_messages),
            "automation": deque(maxlen = max_messages)
        }

    def add(
        self, 
        role: str, 
        content: str, 
        scope: str = "chat",
        tool_name: str | None = None
    ):
        buffer = self._buffers.setdefault(scope, deque(maxlen = self.max_messages))
        msg = {"role": role, "content": content}
        if tool_name:
            msg["tool_name"] = tool_name
        buffer.append(msg)

    def snapshot(self, scopes: list[str] = ["chat"]) -> MemorySnapshot:
        # stable copy of memory for event / task
        merged: list[dict[str, Any]] = []
        for scope in scopes:
            buffer = self._buffers.get(scope)
            if buffer:
                merged.extend(list(buffer))
                
        return MemorySnapshot(messages = merged)

    def clear(self, *, scope: str | None = None):
        if scope is None:
            for b in self._buffers.values():
                b.clear()
        else:
            self._buffers.get(scope, deque()).clear()