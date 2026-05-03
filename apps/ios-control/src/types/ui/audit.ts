import { AuditEvent, AuditEventOutcome, AuditEventStage } from "../api/audit";

export type Density = "comfy" | "compact";

export type Filters = {
  outcomes: Set<AuditEventOutcome>;
  stages: Set<AuditEventStage>;
  tools: Set<string>;
};

export type FeedSection = {
  iso: string;
  data: AuditEvent[];
}
