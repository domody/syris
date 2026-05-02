import type { BadgeVariant } from "@/components/ui/badge";
import type { RiskLevel } from "@/types";
import type { Lane, SyrisResponse } from "@/types";

export const RISK_BADGE: Record<RiskLevel, BadgeVariant> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

export function nowTimestamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function laneForKind(kind: SyrisResponse["kind"]): Lane {
  if (kind === "task_created") return "task";
  if (kind === "approval_surfaced") return "gated";
  if (kind === "dry_run") return "fast";
  return "llm";
}
