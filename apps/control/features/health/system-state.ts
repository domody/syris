// import { SystemStatus } from "@/components/status-dot";
import { stat } from "fs";
import { HealthQuery } from "./use-health";

export type SystemStateKey =
  | "unknown"
  | "healthy"
  | "degraded"
  | "partial_outage"
  | "major_outage";

type SystemState = {
  uiStatus: SystemStateKey;
  title: string;
  description: string;
  shortLabel: string;
  severity: "neutral" | "success" | "warning" | "danger";
  color: string;
  reason?: string;
};

export const statusColor: Record<SystemStateKey, string> = {
  unknown: "bg-neutral-300 dark:bg-neutral-700",
  healthy: "bg-green-500",
  degraded: "bg-amber-500",
  partial_outage: "bg-orange-500",
  major_outage: "bg-destructive",
};

export const SYSTEM_STATES: Record<SystemStateKey, SystemState> = {
  unknown: {
    uiStatus: "unknown",
    title: "System status unknown",
    description: "We can't determine the current system health yet.",
    shortLabel: "Unknown",
    severity: "neutral",
    color: statusColor["unknown"],
  },
  healthy: {
    uiStatus: "healthy",
    title: "All systems operational",
    description: "Everything is working normally.",
    shortLabel: "Operational",
    severity: "success",
    color: statusColor["healthy"],
  },
  degraded: {
    uiStatus: "degraded",
    title: "Degraded performance",
    description:
      "Some parts of the system are slower or less reliable than usual.",
    shortLabel: "Degraded",
    severity: "warning",
    color: statusColor["degraded"],
  },
  partial_outage: {
    uiStatus: "partial_outage",
    title: "Partial outage",
    description: "Some system components are currently unavailable.",
    shortLabel: "Partial outage",
    severity: "danger",
    color: statusColor["partial_outage"],
  },
  major_outage: {
    uiStatus: "major_outage",
    title: "Major outage",
    description: "The system is currently unavailable.",
    shortLabel: "Major outage",
    severity: "danger",
    color: statusColor["major_outage"],
  },
};

export function getSystemState(query: HealthQuery): SystemState {
  if (query.isPending || query.isLoading) {
    return {
      ...SYSTEM_STATES.unknown,
      reason: "query_pending",
    };
  }

  if (query.isError) {
    return {
      ...SYSTEM_STATES.major_outage,
      reason: "query_error",
    };
  }

  const data = query.data;
  if (!data) {
    return {
      ...SYSTEM_STATES.unknown,
      reason: "no_data",
    };
  }

  if (data.status === "ok" && data.db?.ok) {
    return {
      ...SYSTEM_STATES.healthy,
      reason: "api_ok_db_ok",
    };
  }

  if (data.status === "degraded") {
    return {
      ...SYSTEM_STATES.degraded,
      reason: "api_degraded",
    };
  }

  if (!data.db?.ok) {
    return {
      ...SYSTEM_STATES.partial_outage,
      reason: "db_not_ok",
    };
  }

  return {
    ...SYSTEM_STATES.unknown,
    reason: "fallback",
  };
}
