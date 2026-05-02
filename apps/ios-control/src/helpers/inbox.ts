import type { BadgeVariant } from "@/types/ui/badge";
import type { RiskLevel } from "@/types/common";
import type { InboxItem } from "@/types/api/inbox";
import type { FilterId } from "@/types/ui/inbox";

export const RISK_VARIANT: Record<RiskLevel, BadgeVariant> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

export const FILTER_DEFS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Needs action" },
  { id: "agent", label: "Agents" },
  { id: "info", label: "Info" },
  { id: "alarm", label: "Alarms" },
];

export function filterItems(items: InboxItem[], filter: FilterId): InboxItem[] {
  switch (filter) {
    case "action":
      return items.filter(
        (it) => it.kind === "approval" || it.kind === "escalation",
      );
    case "agent":
      return items.filter((it) => it.kind === "agent");
    case "info":
      return items.filter((it) => it.kind === "info");
    case "alarm":
      return items.filter((it) => it.kind === "alarm");
    default:
      return items;
  }
}
