"""Context builder for LLM conversation calls.

Assembles a ContextBundle containing conversation history, system prompt,
tool catalog, and recent audit events. The bundle is converted to a
ChatMessage list for the provider.
"""
import logging
from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..schemas.events import MessageEvent
from ..schemas.llm import ChatMessage
from ..storage.db import session_scope
from ..storage.models import AuditEventRow
from ..storage.repos.events import EventRepo
from ..tools.registry import ToolRegistry
from .prompts import FALLBACK_EXAMPLES, build_system_prompt

logger = logging.getLogger(__name__)


class ConversationTurn(BaseModel):
    """A single turn in a conversation thread."""

    role: Literal["user", "assistant"]
    content: str
    event_id: UUID
    created_at: datetime


class ContextBundle(BaseModel):
    """Complete context assembled for an LLM conversation call."""

    trace_id: UUID
    thread_id: UUID
    system_prompt: str
    conversation_history: list[ConversationTurn] = Field(default_factory=list)
    current_user_message: str
    tool_catalog: str = ""
    recent_audit_events: list[dict[str, Any]] = Field(default_factory=list)


class ContextBuilder:
    """Builds context bundles for LLM conversation calls.

    Queries conversation history by thread_id, fetches the tool catalog,
    and assembles everything into a ContextBundle that can be converted
    to a ChatMessage list for the provider.
    """

    def __init__(
        self,
        session_maker: async_sessionmaker[AsyncSession],
        tool_registry: ToolRegistry,
    ) -> None:
        self._session_maker = session_maker
        self._tool_registry = tool_registry

    async def build(self, event: MessageEvent) -> ContextBundle:
        """Assemble full context for an LLM conversation call."""
        tool_catalog = self._tool_registry.llm_tool_catalog()
        system_prompt = build_system_prompt(tool_catalog)

        # Fetch conversation history for this thread (excludes current event
        # since it was just persisted by the normalizer moments ago — it will
        # appear in the list). We filter it out to avoid duplication.
        history: list[ConversationTurn] = []
        audit_summaries: list[dict[str, Any]] = []

        async with session_scope(self._session_maker) as session:
            repo = EventRepo(session)
            rows = await repo.list_by_thread(event.thread_id, limit=50)

            for row in rows:
                # Skip the current event — it goes into current_user_message
                if row.event_id == event.event_id:
                    continue
                role: Literal["user", "assistant"] = (
                    "assistant" if row.source == "llm" else "user"
                )
                history.append(
                    ConversationTurn(
                        role=role,
                        content=row.content,
                        event_id=row.event_id,
                        created_at=row.created_at,
                    )
                )

            # Fetch recent audit events for context
            from sqlalchemy import select

            stmt = (
                select(AuditEventRow)
                .where(AuditEventRow.trace_id == event.trace_id)
                .order_by(AuditEventRow.timestamp.desc())
                .limit(10)
            )
            result = await session.execute(stmt)
            audit_rows = list(result.scalars().all())
            audit_summaries = [
                {
                    "type": r.type,
                    "summary": r.summary,
                    "outcome": r.outcome,
                    "timestamp": r.timestamp.isoformat(),
                }
                for r in audit_rows
            ]

        current_message = event.content or str(event.structured)

        return ContextBundle(
            trace_id=event.trace_id,
            thread_id=event.thread_id,
            system_prompt=system_prompt,
            conversation_history=history,
            current_user_message=current_message,
            tool_catalog=tool_catalog,
            recent_audit_events=audit_summaries,
        )

    def to_messages(self, bundle: ContextBundle) -> list[ChatMessage]:
        """Convert a ContextBundle into a ChatMessage list for the provider."""
        messages: list[ChatMessage] = [
            ChatMessage(role="system", content=bundle.system_prompt),
        ]

        # Include few-shot examples before conversation history
        for example in FALLBACK_EXAMPLES:
            messages.append(ChatMessage(role="user", content=example["user"]))
            messages.append(ChatMessage(role="assistant", content=example["assistant"]))

        # Conversation history (chronological)
        for turn in bundle.conversation_history:
            messages.append(ChatMessage(role=turn.role, content=turn.content))

        # Current user message
        messages.append(ChatMessage(role="user", content=bundle.current_user_message))

        return messages
