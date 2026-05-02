import { AuditEvent, AuditEventOutcome, AuditEventStage } from "../api/audit";

export type Density = "comfy" | "compact";

export type Filters = {
  outcomes: Set<AuditEventOutcome>;
  stages: Set<AuditEventStage>;
  tools: Set<string>;
};

export type FeedItem =
  | { kind: "divider"; key: string; iso: string }
  | { kind: "event"; key: string; event: AuditEvent };
