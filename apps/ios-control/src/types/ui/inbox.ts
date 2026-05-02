import type { Theme } from "@/theme";

import type { RiskLevel } from "../common";

export type FilterId = "all" | "action" | "agent" | "info" | "alarm";
export type CardColors = Theme["colors"];

export type ApprovalItem = {
  id: string;
  kind: "approval";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  approvalId: string;
  riskLevel: RiskLevel;
  expiresIn: string;
};

export type EscalationItem = {
  id: string;
  kind: "escalation";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  escalationId: string;
};

export type AgentItem = {
  id: string;
  kind: "agent";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  runId: string;
  elapsed: string;
};

export type InfoItem = {
  id: string;
  kind: "info";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  eventId: string;
};

export type AlarmItem = {
  id: string;
  kind: "alarm";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  alarmId: string;
  autocleared: boolean;
};

export type InboxItem =
  | ApprovalItem
  | EscalationItem
  | AgentItem
  | InfoItem
  | AlarmItem;
