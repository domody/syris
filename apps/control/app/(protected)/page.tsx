"use client";

import { useMemo } from "react";
import { Topbar } from "@/components/nav/topbar";
import { useSSEStore, type SSEEvent } from "@/lib/sse";
import { useHealth, useAuditEvents, useTasks } from "@/lib/api/queries";
import type { AuditEvent, TaskResponse } from "@/lib/api/types";
import {
  MetricStrip,
  type MetricChip,
} from "@workspace/ui/components/metric-strip";
import {
  AuditStream,
  type AuditStreamItem,
} from "@workspace/ui/components/audit-stream";
import {
  EventStream,
  type LiveEvent,
} from "@workspace/ui/components/event-stream";
import {
  ToolExecutions,
  type ToolExecution,
} from "@workspace/ui/components/tool-executions";
import { AutonomyLevel } from "@workspace/ui/components/autonomy-level";
import { AuditSearch } from "@workspace/ui/components/audit-search";
import {
  LlmFallback,
  type LlmFallbackStats,
} from "@workspace/ui/components/llm-fallback";
import {
  SystemHealth,
  type SystemHealthItem,
} from "@workspace/ui/components/system-health";
import {
  ScheduleQueue,
  type ScheduledItem,
} from "@workspace/ui/components/schedule-queue";
import type { SystemStateKey } from "@workspace/ui/types/system-state";

// Helpers

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso.slice(11, 19);
  }
}

function fmtUptime(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400)
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// AuditEvent -> AuditStreamItem

function toAuditStreamItem(ev: AuditEvent): AuditStreamItem {
  const outcomeStatus: Record<string, AuditStreamItem["status"]> = {
    success: "success",
    failure: "destructive",
    suppressed: "warn",
    info: "in_progress",
  };
  const label = ev.tool_name ? `${ev.type} | ${ev.tool_name}` : ev.type;
  return {
    status: outcomeStatus[ev.outcome] ?? "in_progress",
    label,
    trace: ev.trace_id,
    time: fmtTime(ev.timestamp),
  };
}

// AuditEvent -> LiveEvent

function toLiveEvent(ev: AuditEvent, idx: number): LiveEvent {
  const connId = ev.connector_id?.toLowerCase() ?? "";
  const channel: LiveEvent["channel"] =
    connId.includes("email") || connId.includes("gmail")
      ? "email"
      : connId.includes("webhook") ||
          connId.includes("github") ||
          connId.includes("stripe")
        ? "webhook"
        : connId.includes("cron") || ev.stage === "scheduler"
          ? "cron"
          : connId.includes("ha") || connId.includes("home")
            ? "ha"
            : "manual";

  const routing: LiveEvent["routing"] =
    ev.outcome === "suppressed"
      ? "dropped"
      : ev.stage === "gate"
        ? "gated"
        : ev.type.toLowerCase().includes("llm") ||
            ev.type.toLowerCase().includes("fallback")
          ? "llm"
          : "rule";

  return {
    id: `${ev.audit_id}-${idx}`,
    channel,
    summary: ev.summary,
    routing,
    time: fmtTime(ev.timestamp),
    trace: ev.trace_id,
  };
}

// AuditEvent -> ToolExecution

function toToolExecution(ev: AuditEvent): ToolExecution {
  const riskMap: Record<string, ToolExecution["risk"]> = {
    low: "low",
    medium: "medium",
    high: "high",
    critical: "high",
  };
  const statusMap: Record<string, ToolExecution["status"]> = {
    success: "success",
    failure: "failed",
    suppressed: "gated",
    info: "running",
  };
  return {
    tool: ev.tool_name ?? ev.type,
    risk: riskMap[ev.risk_level ?? "low"] ?? "low",
    duration: fmtDuration(ev.latency_ms),
    status: statusMap[ev.outcome] ?? "running",
    idem: ev.audit_id,
  };
}

// TaskResponse -> ScheduledItem

function toScheduledItem(task: TaskResponse): ScheduledItem {
  const age = (Date.now() - new Date(task.created_at).getTime()) / 1000;
  const overdue = age > 3600 && task.status === "pending";
  const waitLabel =
    age < 60
      ? `${Math.round(age)}s ago`
      : age < 3600
        ? `${Math.floor(age / 60)}m ago`
        : `${Math.floor(age / 3600)}h ago`;
  return {
    title: task.handler,
    cron: `trace ${task.trace_id.slice(0, 8)}`,
    next_fire: overdue ? `overdue ${waitLabel}` : `waiting ${waitLabel}`,
    overdue,
  };
}

// Page
export default function Page() {
  const sseStatus = useSSEStore((s) => s.status);
  const sseAuditEvents = useSSEStore(
    (s) => s.events.audit_event as SSEEvent<AuditEvent>[],
  );

  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: auditData, isLoading: auditLoading } = useAuditEvents({
    limit: 100,
  });
  const { data: tasks, isLoading: tasksLoading } = useTasks(50);

  // MetricStrip
  const chips = useMemo((): MetricChip[] => {
    if (!health && !tasks && !auditData) return [];

    const activeTasks =
      tasks?.filter((t) => t.status === "running").length ?? 0;
    const pendingTasks =
      tasks?.filter((t) => t.status === "pending").length ?? 0;
    const failedTasks = tasks?.filter((t) => t.status === "failed").length ?? 0;

    // Avg latency from audit events with latency_ms
    const latencies =
      auditData
        ?.map((e) => e.latency_ms)
        .filter((v): v is number => v != null) ?? [];
    const p95 =
      latencies.length > 0
        ? (latencies.sort((a, b) => a - b)[
            Math.floor(latencies.length * 0.95)
          ] ?? null)
        : null;

    return [
      {
        label: "SYSTEM",
        value: health?.status === "ok" ? "ok" : (health?.status ?? "—"),
        variant:
          health?.status === "ok" ? "success" : health ? "warning" : "default",
      },
      {
        label: "ACTIVE TASKS",
        value: activeTasks,
        variant: activeTasks > 0 ? "pending" : "default",
      },
      {
        label: "PENDING",
        value: pendingTasks,
        variant: pendingTasks > 0 ? "warning" : "default",
      },
      {
        label: "FAILURES",
        value: failedTasks,
        variant: failedTasks > 0 ? "destructive" : "default",
        sub: "tasks",
      },
      ...(p95 != null
        ? [
            {
              label: "P95 LATENCY",
              value: fmtDuration(p95),
              sub: "tool exec",
            } satisfies MetricChip,
          ]
        : []),
      ...(health != null
        ? [
            {
              label: "UPTIME",
              value: fmtUptime(health.uptime_s),
            } satisfies MetricChip,
          ]
        : []),
    ];
  }, [health, tasks, auditData]);

  // AuditStream
  // Prefer live SSE events, fall back to REST data
  const auditStreamItems = useMemo((): AuditStreamItem[] => {
    const liveItems = sseAuditEvents
      .slice(-50)
      .map((e) => toAuditStreamItem(e.payload));
    if (liveItems.length > 0) return liveItems;
    return (auditData ?? []).slice(0, 50).map(toAuditStreamItem).reverse();
  }, [sseAuditEvents, auditData]);

  // EventStream
  // OLD, NEEDS REIMPLEMENTATION: All SSE events as a live log; fall back to REST audit data
  // NEW: All MessageEvents into the system, showing all incoming traffic into the system
  const liveEvents = useMemo((): LiveEvent[] => {
    const liveItems = sseAuditEvents
      .slice(-50)
      .map((e, i) => toLiveEvent(e.payload, i));
    if (liveItems.length > 0) return liveItems;
    return (auditData ?? [])
      .slice(0, 50)
      .filter((e) => e.type.includes("event.ingested"))
      .map((e, i) => toLiveEvent(e, i))
      .reverse();
  }, [sseAuditEvents, auditData]);

  // ToolExecutions
  const toolExecutions = useMemo((): ToolExecution[] => {
    // Use audit events for tool_call stage (have risk_level + latency_ms)
    const toolCallEvents = (auditData ?? [])
      .filter((e) => e.stage === "tool_call")
      .slice(0, 20);

    // Supplement with SSE tool_call events for real-time updates
    const sseToolCallEvents = sseAuditEvents
      .filter((e) => e.payload.stage === "tool_call")
      .slice(-10)
      .map((e) => e.payload);

    const merged = [...sseToolCallEvents, ...toolCallEvents].slice(0, 15);
    return merged.map(toToolExecution);
  }, [auditData, sseAuditEvents]);

  // SystemHealth
  const healthItems = useMemo((): SystemHealthItem[] => {
    if (!health) return [];
    const overall: SystemStateKey =
      health.status === "ok" ? "healthy" : "degraded";
    const dbState: SystemStateKey = health.db.ok ? "healthy" : "major_outage";
    return [
      { title: "API Service", status: overall },
      { title: "Database", status: dbState },
    ];
  }, [health]);

  // ScheduleQueue (pending/paused tasks as work queue)
  const queuedItems = useMemo((): ScheduledItem[] => {
    return (tasks ?? [])
      .filter((t) => t.status === "pending" || t.status === "paused")
      .slice(0, 6)
      .map(toScheduledItem);
  }, [tasks]);

  // LlmFallback stats derived from audit events
  const llmStats = useMemo((): LlmFallbackStats | undefined => {
    if (!auditData || auditData.length === 0) return undefined;
    const routeEvents = auditData.filter((e) => e.stage === "route");
    const llmCalls = routeEvents.filter(
      (e) =>
        e.type.toLowerCase().includes("llm") ||
        e.type.toLowerCase().includes("fallback"),
    ).length;
    const ruleHits = routeEvents.length - llmCalls;
    const latencies = auditData
      .map((e) => e.latency_ms)
      .filter((v): v is number => v != null);
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;
    return {
      total: routeEvents.length,
      ruleHits,
      llmCalls,
      avgLatencyMs,
    };
  }, [auditData]);

  // AuditSearch entries
  const auditLogEntries = useMemo(() => {
    return (auditData ?? []).slice(0, 100).map((e) => ({
      time: fmtTime(e.timestamp),
      type: e.type,
      meta: e.tool_name ?? e.connector_id ?? e.trace_id.slice(0, 8),
    }));
  }, [auditData]);

  const isMetricLoading = healthLoading && tasksLoading && auditLoading;

  return (
    <div className="flex flex-col flex-1 items-start justify-start">
      <Topbar>
        <h1 className="font-semibold text-lg">Overview</h1>
        <span
          className={
            "ml-2 font-mono text-[10px] " +
            (sseStatus === "connected"
              ? "text-success"
              : sseStatus === "connecting"
                ? "text-pending"
                : "text-destructive")
          }
        >
          ● {sseStatus}
        </span>
      </Topbar>
      <div className="flex flex-1 flex-col gap-3 w-full p-4 items-start justify-start">
        <MetricStrip chips={chips} isLoading={isMetricLoading} />
        <div className="grid grid-cols-3 gap-3 w-full min-w-0">
          <Column>
            <AuditStream
              items={auditStreamItems}
              isLoading={auditLoading && sseAuditEvents.length === 0}
            />
            <ToolExecutions
              executions={toolExecutions}
              isLoading={auditLoading}
            />
          </Column>
          <Column>
            <EventStream
              events={liveEvents}
              todayCount={liveEvents?.length}
              isLoading={auditLoading && sseAuditEvents.length === 0}
            />
            <ScheduleQueue items={queuedItems} isLoading={tasksLoading} />
          </Column>
          <Column>
            <SystemHealth
              items={healthItems}
              uptime={health ? fmtUptime(health.uptime_s) : undefined}
              version={health?.version}
              isLoading={healthLoading}
            />
            <AutonomyLevel />
            <LlmFallback stats={llmStats} isLoading={auditLoading} />
            <AuditSearch entries={auditLogEntries} isLoading={auditLoading} />
          </Column>
        </div>
      </div>
    </div>
  );
}

function Column({ ...props }: React.ComponentProps<"div">) {
  return <div className="flex flex-col gap-3 min-w-0" {...props} />;
}
