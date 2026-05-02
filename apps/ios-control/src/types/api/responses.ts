import type { RiskLevel } from "../common";

export type BaseResponse = { traceId: string; timestamp: string };

export type TaskCreatedResponse = BaseResponse & {
  kind: "task_created";
  taskId: string;
  summary: string;
  steps: number;
};

export type ApprovalSurfacedResponse = BaseResponse & {
  kind: "approval_surfaced";
  approvalId: string;
  why: string;
  what: string;
  riskLevel: RiskLevel;
  expiresIn: string;
};

export type DryRunResponse = BaseResponse & {
  kind: "dry_run";
  preview: string[];
  note: string;
};

export type InformationalResponse = BaseResponse & {
  kind: "informational";
  answer: string;
};

export type GeneralChatResponse = BaseResponse & {
  kind: "general_chat";
  text: string;
};

export type SyrisResponse =
  | TaskCreatedResponse
  | ApprovalSurfacedResponse
  | DryRunResponse
  | InformationalResponse
  | GeneralChatResponse;

export type Exchange = {
  id: string;
  timestamp: string;
  autonomy: string;
  command: string;
  response: SyrisResponse | null;
};

export type Lane = "fast" | "task" | "gated" | "llm";
