import type { TransportEvent } from "@/types";

export type EventLinks = {
  request_id?: string;
  trace_id?: string;
  entity_id?: string;
};

export function getEventLinks(ev: TransportEvent): EventLinks {
  const links: EventLinks = {};

  if (ev.request_id) links.request_id = ev.request_id;
  if (ev.trace_id) links.trace_id = ev.trace_id;
  if (ev.entity_id) links.entity_id = ev.entity_id;

  // Promote from payload for system events like trace.link
  const p = ev.payload as any;
  if (!links.request_id && typeof p?.request_id === "string") links.request_id = p.request_id;
  if (!links.trace_id && typeof p?.trace_id === "string") links.trace_id = p.trace_id;
  if (!links.entity_id && typeof p?.matched_on?.entity_id === "string") links.entity_id = p.matched_on.entity_id;

  return links;
}
