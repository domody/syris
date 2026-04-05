"""
Core types for the SYRIS tool registry.

Tools are the authoritative capability surface of the system. Each tool
declares its own metadata (name, description, args schema, risk level)
and implements execute(). The ToolExecutor handles validation, gating,
and audit — execute() should contain only domain logic.
"""
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Callable, ClassVar, Coroutine

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..observability.audit import AuditWriter
from ..safety.autonomy import AutonomyService
from ..schemas.audit import RiskLevel as RiskLevel  # re-exported for tool authors

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ToolDeps:
    """
    Dependency bundle injected into every BaseTool at construction time.

    Secrets MUST NOT be stored on self. Call get_secret(connector_id, key)
    inside execute(), use the value immediately, and let it go out of scope.
    """

    session_maker: async_sessionmaker[AsyncSession]
    audit: AuditWriter
    autonomy_service: AutonomyService
    get_secret: Callable[[str, str], Coroutine[Any, Any, str]]


class ToolResult(BaseModel):
    """
    Structured return value from a tool execution.

    summary — human-readable one-liner; used in audit events and LLM context.
    data    — machine-readable payload returned as output_payload to the task engine.
              Must be JSON-serialisable.
    """

    summary: str
    data: dict[str, Any] = {}

    model_config = {"frozen": True}


class BaseTool(ABC):
    """
    Abstract base for all SYRIS tools.

    Subclasses declare class-level metadata and implement execute().
    The ToolExecutor is responsible for arg validation, gate checking,
    idempotency, and audit emission — execute() must not call AuditWriter.

    Class attributes (all required):
        name            Dotted string key, e.g. "schedule.create".
                        Used as the registry key and in LLM prompts.
        description     One sentence. Used verbatim in the LLM tool catalog.
                        Be specific — the LLM sees this + field descriptions.
        args_schema     A Pydantic BaseModel subclass. Validated before execute().
        risk_level      "low" | "medium" | "high" | "critical"
        idempotent      True if re-executing with the same input is safe.
    """

    name: ClassVar[str]
    description: ClassVar[str]
    args_schema: ClassVar[type[BaseModel]]
    risk_level: ClassVar[RiskLevel]
    idempotent: ClassVar[bool] = False

    def __init__(self, deps: ToolDeps) -> None:
        self._deps = deps

    @abstractmethod
    async def execute(self, args: BaseModel) -> ToolResult:
        """
        Execute the tool's action.

        args is a validated instance of self.args_schema.
        Raise ValueError for domain-level errors (not found, invalid input).
        Raise RuntimeError for infrastructure failures.
        Do NOT call AuditWriter. Do NOT log or store secrets.
        """
