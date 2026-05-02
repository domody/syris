export type TaskStatus =
  | "running"
  | "waiting"
  | "blocked"
  | "failed"
  | "completed";
export type FilterKey =
  | "all"
  | "decision"
  | "action"
  | "intervention"
  | "failed";
export type TabView = "trace" | "checkpoints" | "context";

export type StepRef = {
  k: string;
  v: string;
};
