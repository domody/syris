import type { Theme } from "@/theme";
import type {
    AuditEvent,
    AuditEventOutcome,
    AuditEventStage,
} from "@/types/api/audit";
import type { FeedItem } from "@/types/ui/audit";

export const ALL_STAGES: AuditEventStage[] = [
  "normalize",
  "route",
  "execute",
  "tool_call",
  "gate",
  "operator",
  "scheduler",
  "watcher",
  "rule",
  "mcp",
  "task",
];

export const ALL_OUTCOMES: AuditEventOutcome[] = [
  "success",
  "failure",
  "suppressed",
  "info",
];

export function stageColorKey(stage: AuditEventStage): keyof Theme["colors"] {
  const map: Record<AuditEventStage, keyof Theme["colors"]> = {
    normalize: "stageNormalize",
    route: "stageRoute",
    execute: "stageExecute",
    tool_call: "stageToolCall",
    gate: "stageGate",
    operator: "stageOperator",
    scheduler: "stageScheduler",
    watcher: "stageWatcher",
    rule: "stageRule",
    mcp: "stageMcp",
    task: "stageTask",
  };
  return map[stage];
}

export function outcomeStripeColor(
  outcome: AuditEventOutcome,
  colors: Theme["colors"],
): string {
  if (outcome === "success") return colors.success;
  if (outcome === "failure") return colors.error;
  if (outcome === "suppressed") return colors.muted;
  return colors.info;
}

export function outcomeLabel(outcome: AuditEventOutcome): string {
  if (outcome === "success") return "ok";
  if (outcome === "failure") return "fail";
  if (outcome === "suppressed") return "suppressed";
  return "info";
}

export function outcomeLabelColor(
  outcome: AuditEventOutcome,
  colors: Theme["colors"],
): string {
  if (outcome === "success") return colors.successEmphasis;
  if (outcome === "failure") return colors.errorEmphasis;
  if (outcome === "suppressed") return colors.muted;
  return colors.accentEmphasis;
}

export function outcomeLabelBg(
  outcome: AuditEventOutcome,
  colors: Theme["colors"],
): string {
  if (outcome === "success") return colors.badgeSuccessBg;
  if (outcome === "failure") return colors.badgeErrorBg;
  if (outcome === "suppressed") return colors.elementBg;
  return colors.badgeInfoBg;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function eventTypeShort(type: string): { ns: string; leaf: string } {
  const parts = type.split(".");
  if (parts.length >= 2) {
    return { ns: parts.slice(0, -1).join("."), leaf: parts[parts.length - 1]! };
  }
  return { ns: "", leaf: type };
}

export function getToolNames(events: AuditEvent[]): string[] {
  const names = new Set<string>();
  for (const e of events) {
    if (e.tool_name) names.add(e.tool_name);
  }
  return Array.from(names).sort();
}

export function outcomeCount(
  events: AuditEvent[],
  o: AuditEventOutcome,
): number {
  return events.filter((e) => e.outcome === o).length;
}

export function buildFeedItems(events: AuditEvent[]): FeedItem[] {
  const sorted = [...events].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
  const items: FeedItem[] = [];
  let lastDay = "";
  for (const event of sorted) {
    const day = dayKey(event.timestamp);
    if (day !== lastDay) {
      items.push({ kind: "divider", key: `div-${day}`, iso: event.timestamp });
      lastDay = day;
    }
    items.push({ kind: "event", key: event.audit_id, event });
  }
  return items;
}
