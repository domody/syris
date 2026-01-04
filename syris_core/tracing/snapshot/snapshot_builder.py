from dataclasses import dataclass
from typing import Optional

from syris_core.tracing.models.snapshot import AssistantContext
from syris_core.tracing.models.collector import TraceSummary
from syris_core.tracing.integrations.status import IntegrationStatus
from syris_core.tracing.capabilities.registry import CapabilityRegistry
from syris_core.tracing.collector.trace_collector import TraceCollector
from syris_core.types.llm import Intent
from syris_core.tracing.models.snapshot import Execution

@dataclass
class SnapshotBuilder:
    trace_collector: TraceCollector
    capability_registry: CapabilityRegistry
    integration_status: IntegrationStatus

    def build(
        self,
        request_id: str,
        trace_id: str,
        *,
        intent: Intent,
        max_capabilities: int = 8
    ) -> AssistantContext:
        # base model
        context = AssistantContext(
            request_id=request_id,
            trace_id=trace_id,
            intent=intent,
        )

        # build integrations
        integrations = self.integration_status.get_snapshot()
        context.integrations = integrations

        # get relevant and unavailable capabilities, build into dict
        relevant_capabilities = self.capability_registry.relevant_capabilities(intent=intent)
        capabilities = {
            "relevant": relevant_capabilities
        }
        context.capabilities = capabilities

        # get execution trace
        trace_summary = self.trace_collector.get_snapshot(request_id=request_id)

        if not trace_summary:
            context.execution = Execution(
                outcome="unknown",
                truth_level="unknown",
                steps=[]
            )
        
            return context
    
        context.execution = Execution(
            outcome=trace_summary.outcome,
            truth_level="confirmed",
            steps=trace_summary.steps,
            observed=trace_summary.observed
        )
        
        context.policy = {
            "rules": ["Never claim completion unless confirmed"],
            "gates_triggered": [],  # later: user_confirm_required, restricted time, etc.
        }
        return context
