import type { Theme } from "@/theme";
import type {
    AuditEvent,
    AuditEventOutcome,
    AuditEventStage,
} from "@/types";
import type { FeedItem } from "@/types";
import { FeedSection } from "@/types/ui/audit";

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

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

function formatRelativeEn(value: number, unit: Unit): string {
  const abs = Math.abs(value);
  const plural = abs === 1 ? unit : `${unit}s`;

  if (unit === 'day') {
    if (value === -1) return 'yesterday';
    if (value === 1) return 'tomorrow';
  }

  if (value === 0) return `this ${unit}`;
  if (value > 0) return `in ${abs} ${plural}`;
  return `${abs} ${plural} ago`;
}

export function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  const diffMs = then - now;

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours   = Math.round(minutes / 60);
  const days    = Math.round(hours / 24);
  const weeks   = Math.round(days / 7);
  const months  = Math.round(days / 30);
  const years   = Math.round(days / 365);

  if (Math.abs(days) < 7)   return formatRelativeEn(days, "day");
  if (Math.abs(weeks) < 4)  return formatRelativeEn(weeks, "week");
  if (Math.abs(months) < 12) return formatRelativeEn(months, "month");
  return formatRelativeEn(years, "year");
}

export function formatDate(iso: string): string {
  return iso.slice(0, 10)
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

export function buildFeedItems(events: AuditEvent[]): FeedSection[] {
  const sorted = [...events].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  )

  const sections: FeedSection[] = [];
  let currentSection: FeedSection | null = null;
  let lastDay = "";

  for (const event of sorted) {
    const day = dayKey(event.timestamp)

    if (day !== lastDay) {
      currentSection = {
        iso: event.timestamp,
        data: [],
      }
      sections.push(currentSection);
      lastDay = day
    }

    currentSection!.data.push(event);
  }

  return sections
}
