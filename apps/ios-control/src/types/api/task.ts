import { RiskLevel } from "../common";
import { StepRef, TaskStatus } from "../ui/task-details";

export type StepState = "done" | "running" | "waiting" | "failed" | "pending";
export type StepKind = "decision" | "action" | "intervention";

export type TaskStep = {
  id: string;
  kind: StepKind;
  t: string;
  dur: number | null;
  title: string;
  why: string;
  detail: string;
  refs: StepRef[];
  state: StepState;
  outcome?: string;
  error?: string;
};

export type TaskPhase = {
  id: string;
  label: string;
  collapsed: boolean;
  steps: TaskStep[];
};

export type TaskCheckpoint = {
  id: string;
  t: string;
  label: string;
  summary: string;
  state: "committed";
  current?: boolean;
};

export type TaskContextRow = {
  k: string;
  v: string;
};

export type TaskContext = {
  inputs: TaskContextRow[];
  state: TaskContextRow[];
  external: TaskContextRow[];
};

export type Task = {
  task_id: string;
  trace_id: string;
  name: string;
  goal: string;
  status: TaskStatus;
  startedAt: string;
  elapsedMs: number;
  etaMs: number | null;
  stepIdx: number;
  stepTotal: number;
  autonomy_level: "A0" | "A1" | "A2" | "A3" | "A4";
  risk_level: RiskLevel;
  causedBy: string;
  phases: TaskPhase[];
  checkpoints: TaskCheckpoint[];
  context: TaskContext;
  failedStepId?: string;
};
