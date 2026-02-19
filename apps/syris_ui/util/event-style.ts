import type { EventKind, Level, TransportEvent } from "@/types";

export function levelLabel(level: Level): string {
  return level.toUpperCase();
}

export function kindLabel(kind: EventKind): string {
  return kind.toUpperCase();
}

/**
 * Map to shadcn badge variants:
 * - "default" | "secondary" | "destructive" | "outline"
 */
export function levelBadgeVariant(level: Level): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "error":
      return "destructive";
    case "warn":
      return "default";
    case "debug":
      return "outline";
    case "info":
    default:
      return "secondary";
  }
}

export function kindBadgeVariant(kind: EventKind): "default" | "secondary" | "destructive" | "outline" {
  switch (kind) {
    case "error":
      return "destructive";
    case "assistant":
      return "default";
    case "tool":
      return "secondary";
    case "device":
      return "outline";
    default:
      return "secondary";
  }
}

export function isHighSignal(ev: TransportEvent): boolean {
  if (ev.level === "error") return true;
  if (ev.kind === "error") return true;

  // tool failures are high-signal even if level wasn't set correctly
  const p = ev.payload as any;
  if (ev.kind === "tool" && p?.phase === "failure") return true;

  // integration health disconnect
  if (p?.kind === "integration.health" && typeof p?.patch?.connected === "boolean" && p.patch.connected === false)
    return true;

  return false;
}
