import type { EventKind, Level } from "./enums";

export type StreamSubscription = {
  name: string; // "logs" | "events" | etc.
  kinds?: EventKind[];
  levels?: Level[];

  include_payload?: boolean;
  include_payload_raw?: boolean;
  sample_rate?: number; // 0..1
};

export type TransportFilters = {
  request_id?: string | null;
  entity_id?: string | null;
  entity_prefix?: string | null;

  kinds?: EventKind[];
  levels?: Level[];

  // optional future filters
  integration_id?: string | null;
  tool_name?: string | null;
};

export type SubscribeOptions = {
  include_recent?: boolean;
  recent_limit?: number; // 0..10000
};
