
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, ClassVar
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlmodel import Field, SQLModel
 
from ..storage.db import session_scope
from ..storage.models import AuditEventRow
from ..schemas.audit import AuditEvent, AuditOutcome, AuditStage, AutonomyLevel, RiskLevel

class AuditWriteError(Exception):
    """
    Raised when an AuditEvent cannot be persisted to the DB.

    This must NOT be caught and suppressed anywhere in the pipeline.
    The calling stage should let it propagate and fail the operation.
    """



class AuditWriter:
    """
    Sole point of audit emition for SYRIS.

    Constructed once per application lifetime and pass into each pipeline
    stage that needs to emit.

    Usage::
        writer = AuditWriter(session_maker)

        # Simple emit
        await writer.emit(
            trace_id,
            stage="normalize",
            type="event.ingested",
            summary="MessageEvent abc123 ingested from chat",
            outcome="info",
            ref_event_id=event.event_id,
        )

        # Emit with automatic latency tracking
        async with writer.span(trace_id, stage="tool_call", type="tool_call.attempted", ...) as span:
            result = await run_tool(...)
            span.outcome = "success" # update outcome before the context exits
    """


    def __init__(self, session_maker: async_sessionmaker[AsyncSession]) -> None:
        self._session_maker = session_maker

    # Primary API

    async def emit(
            self,
            trace_id: UUID, # Positional, omission is a type error by design
            *,
            stage: AuditStage,
            type: str,
            summary: str,
            outcome: AuditOutcome,
            ref_event_id: Optional[UUID] = None,
            ref_task_id: Optional[UUID] = None,
            ref_step_id: Optional[UUID] = None,
            ref_tool_call_id: Optional[UUID] = None,
            ref_approval_id: Optional[UUID] = None,
            latency_ms: Optional[int] = None,
            tool_name: Optional[str] = None,
            connector_id: Optional[str] = None,
            risk_level: Optional[RiskLevel] = None,
            autonomy_level: Optional[AutonomyLevel] = None,
            payload_ref: Optional[str] = None, 
           ) -> AuditEvent:
            """
            Build and persist an AuditEvent.

            Returns the persisted event (useful for tests or chaining).
            Raises AuditWriteError if the INSERT fails, do not catch this.
            """
            event = AuditEvent(
                trace_id=trace_id,
                stage=stage,
                type=type,
                summary=summary,
                outcome=outcome,
                ref_event_id=ref_event_id,
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
                ref_tool_call_id=ref_tool_call_id,
                ref_approval_id=ref_approval_id,
                latency_ms=latency_ms,
                tool_name=tool_name,
                connector_id=connector_id,
                risk_level=risk_level,
                autonomy_level=autonomy_level,
                payload_ref=payload_ref,
            )

            await self._insert(event)
            return event

    @asynccontextmanager
    async def span(
                 self,
        trace_id: UUID,
        *,
        stage: AuditStage,
        type: str,
        summary: str,
        outcome: AuditOutcome = "info",
        ref_event_id: Optional[UUID] = None,
        ref_task_id: Optional[UUID] = None,
        ref_step_id: Optional[UUID] = None,
        ref_tool_call_id: Optional[UUID] = None,
        ref_approval_id: Optional[UUID] = None,
        tool_name: Optional[str] = None,
        connector_id: Optional[str] = None,
        risk_level: Optional[RiskLevel] = None,
        autonomy_level: Optional[AutonomyLevel] = None,
        payload_ref: Optional[str] = None,
    ) -> AsyncGenerator[_SpanContext, None]:
        """
        Async context manager that times the wrapped block and emits a
        single AuditEvent on exit with the measure latency_ms.

        Callers can mutate the SpanContext to update outcome, summery,
        or payload_ref before the block exits::

            async with writer.span(trace_id, stage="tool_call",
                                   type="tool_call.attempted",
                                   summary="Calling lights.turn_on",
                                   outcome="info") as span:
                result = await tool.run()
                span.outcome = "success"
                span.summary = f"lights.turn_on succeeded in {span.elapsed_ms}ms"
        
        If the block raises an exception, outcome is set to "failure"
        and the event is still emitted before re-raising.
        """
        ctx = _SpanContext(
             outcome=outcome,
             summary=summary,
             payload_ref=payload_ref
        )

        try:
             yield ctx
        except Exception:
             ctx.outcome = "failure"
             raise
        finally:
             await self.emit(
                trace_id,
                stage=stage,
                type=type,
                summary=ctx.summary,
                outcome=ctx.outcome,
                ref_event_id=ref_event_id,
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
                ref_tool_call_id=ref_tool_call_id,
                ref_approval_id=ref_approval_id,
                latency_ms=ctx.elapsed_ms,
                tool_name=tool_name,
                connector_id=connector_id,
                risk_level=risk_level,
                autonomy_level=autonomy_level,
                payload_ref=ctx.payload_ref,
             )

    # Internal, INSERT only

    async def _insert(self, event: AuditEvent) -> None:
        row = AuditEventRow(
            audit_id=str(event.audit_id),
            timestamp=event.timestamp.isoformat(),
            trace_id=str(event.trace_id),
            stage=event.stage,
            type=event.type,
            summary=event.summary,
            outcome=event.outcome,
            ref_event_id=_uuid_or_none(event.ref_event_id),
            ref_task_id=_uuid_or_none(event.ref_task_id),
            ref_step_id=_uuid_or_none(event.ref_step_id),
            ref_tool_call_id=_uuid_or_none(event.ref_tool_call_id),
            ref_approval_id=_uuid_or_none(event.ref_approval_id),
            latency_ms=event.latency_ms,
            tool_name=event.tool_name,
            connector_id=event.connector_id,
            risk_level=event.risk_level,
            autonomy_level=event.autonomy_level,
            payload_ref=event.payload_ref,
        )
        
        try:
             async with session_scope(self._session_maker) as session:
                  session.add(row)
        except Exception as exc:
             raise AuditWriteError(
                  f"Failed to persist AuditEvent {event.audit_id}",
                  f"(trace={event.trace_id}, type={event.type}): {exc}"
             ) from exc

# Internal Helpers

def _uuid_or_none(value: Optional[UUID]) -> Optional[str]:
     return str(value) if value is not None else None

class _SpanContext:
    """
    Mutable bag that callers can update inside a writer.span() block
    before the AuditEvent is emitted on exit.
    """

    def __init__(self, outcome: AuditOutcome, summary: str, payload_ref: Optional[str]) -> None:
        self.outcome: AuditOutcome = outcome
        self.summary: str = summary
        self.payload_ref: Optional[str] = payload_ref
        self._t0: float = time.monotonic()

    @property
    def elapsed_ms(self) -> int:
        """Milliseconds elapsed since the span started (live, pre-exit)."""
        return int((time.monotonic() - self._t0) * 1_000)
    