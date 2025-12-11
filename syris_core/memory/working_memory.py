from collections import deque

# Improvement plan:
#  - Assign each message a relevance score, and only store top K most relevant messages
#  - Track threads based on convo topic. If conversation moves, switch thread.
#  - Hybring working memory containing: immediate messages, thread context, system state, relevant semantic recalls.
#  - When a thread goes stale, summarize contents and relevant points, archive to relevant stores, remove.

class WorkingMemory:
    def __init__(self, max_messages: int = 8):
        self.buffer = deque(maxlen=max_messages)

    def add(self, role: str, content: str, tool_name: str | None = None):
        if tool_name: 
            self.buffer.append({"role": role, "tool_name": tool_name, "content": content})
        else:
            self.buffer.append({"role": role, "content": content})

    def get_context(self):
        return list(self.buffer)

    def clear(self):
        self.buffer.clear()