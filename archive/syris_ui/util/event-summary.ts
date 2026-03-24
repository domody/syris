import type { TransportEvent } from "@/types";
import { truncate } from "./format";
import {
  asToolPayload,
  asDevicePayload,
  asAssistantPayload,
  asInputPayload,
  asIntegrationHealthPayload,
  asTraceLinkPayload,
} from "./event-narrow";

export function summarizeEvent(
  ev: TransportEvent,
  truncate_msg: boolean = true
): string {
  // Assistant
  const a = asAssistantPayload(ev);
  if (a) {
    if (truncate_msg) return truncate(a.text, 140);
    else return a.text;
  }

  // Input
  const i = asInputPayload(ev);
    if (i) {
    if (truncate_msg) return truncate(i.text, 140);
    else return i.text;
  }

  // Device
  const d = asDevicePayload(ev);
  if (d) {
    const from = d.old_state ?? " - ";
    const to = d.new_state ?? " - ";
    return `${d.entity_id} ${String(from)} -> ${String(to)}`;
  }

  // Tool
  const t = asToolPayload(ev);
  if (t) {
    const phase = t.phase ?? "unknown";
    const name = t.kind ?? ev.tool_name ?? "tool";
    const svc = t.domain && t.service ? `${t.domain}.${t.service}` : "";
    if (phase === "failure" && t.error?.message) {
      return `${name} ${svc} ${phase}: ${truncate(
        String(t.error.message),
        120
      )}`;
    }
    return `${name} ${svc} ${phase}`.trim();
  }

  // Integration health (system)
  const ih = asIntegrationHealthPayload(ev);
  if (ih) {
    const c = (ih.patch as any).connected;
    const wsAlive = (ih.patch as any).ws_alive;
    const parts = [`integration=${ih.integration_id}`];
    if (typeof c === "boolean") parts.push(`connected=${c}`);
    if (typeof wsAlive === "boolean") parts.push(`ws_alive=${wsAlive}`);
    const le = (ih.patch as any).last_error?.message;
    if (typeof le === "string" && le.length)
      parts.push(`err=${truncate(le, 90)}`);
    return parts.join(" ");
  }

  // Trace link
  const tl = asTraceLinkPayload(ev);
  if (tl) {
    const matchedOn = tl.matched_on
      ? ` matched_on=${Object.keys(tl.matched_on).join(",")}`
      : "";
    return `trace.link ${tl.cause_event_id.slice(
      0,
      6
    )} -> ${tl.effect_event_id.slice(0, 6)}${matchedOn}`;
  }

  // Fallback: show kind + maybe payload.kind
  const pk = (ev.payload as any)?.kind;
  if (typeof pk === "string") return `${ev.kind}: ${pk}`;
  return `${ev.kind}`;
}
