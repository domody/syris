import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@shopify/restyle";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import type { SymbolViewProps } from "expo-symbols";

import { AutonomyPill } from "@/components/autonomy-pill";
import { monoFont, type Theme } from "@/theme";
import type { RiskLevel } from "@/types/common";
import type {
  StepState,
  StepKind,
  TaskStep,
  TaskPhase,
  TaskCheckpoint,
  TaskContextRow,
  TaskContext,
  Task,
} from "@/types/api/task";
import type { TaskStatus, FilterKey, TabView, StepRef } from "@/types/ui/task-details";

// Type assertion required: SymbolView name prop is a string literal union (SFSymbols7_0),
// not plain string. All values passed to sym() are valid SF Symbol names.
function sym(name: string): SymbolViewProps["name"] {
  return name as SymbolViewProps["name"];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TASK_RUNNING: Task = {
  task_id: "run_01JH7B2QX",
  trace_id: "b82c…771e",
  name: "morning_brief",
  goal: "Compile the weekday morning brief: agenda, inbox triage, weather, household state.",
  status: "running",
  startedAt: "09:39:42",
  elapsedMs: 142_000,
  etaMs: 38_000,
  stepIdx: 3,
  stepTotal: 5,
  autonomy_level: "A3",
  risk_level: "low",
  causedBy: "scheduler · cron weekday@09:39",
  phases: [
    {
      id: "p_acquire",
      label: "Acquire context",
      collapsed: false,
      steps: [
        {
          id: "s1",
          kind: "decision",
          t: "+0.00s",
          dur: 12,
          title: "Plan: 5-step brief",
          why: "Operator profile · weekday template · last-success template hash 8b2f.",
          detail:
            "Selected morning_brief.template@v4 because today=weekday and last successful run used v4 within 7d.",
          refs: [{ k: "template", v: "tpl_morning_brief.v4" }],
          state: "done",
        },
        {
          id: "s2",
          kind: "action",
          t: "+0.04s",
          dur: 8042,
          title: "tool_call · calendar.day_agenda",
          why: "Need today's events to anchor the brief. Standard tool, A3 scoped.",
          detail:
            "GET /v1/calendars/primary/events · range=today · timeout=8000ms.",
          refs: [
            { k: "tool", v: "calendar.day_agenda" },
            { k: "connector", v: "gcal" },
          ],
          state: "failed",
          error: "timeout · upstream gcal · no response within 8.0s",
        },
        {
          id: "s3",
          kind: "decision",
          t: "+8.10s",
          dur: 6,
          title: "Recover: queue retry 1/2",
          why: "Tool error class=timeout is in retryable set; backoff=1500ms; quota OK.",
          detail:
            "Marked tc_01JH7A3K as retryable. Will not block downstream steps.",
          refs: [{ k: "policy", v: "retry.timeout.default" }],
          state: "done",
        },
        {
          id: "s4",
          kind: "action",
          t: "+8.10s",
          dur: 2310,
          title: "tool_call · mail.triage",
          why: "Independent of calendar; can run in parallel while retry is pending.",
          detail:
            "Triaged 14 unread → 4 actionable, 0 VIP. Cached at brief.inbox.snapshot@09:39.",
          refs: [
            { k: "tool", v: "mail.triage" },
            { k: "connector", v: "gmail" },
          ],
          state: "done",
          outcome: "14 unread · 4 actionable · 0 VIP",
        },
      ],
    },
    {
      id: "p_compose",
      label: "Compose & deliver",
      collapsed: false,
      steps: [
        {
          id: "s5",
          kind: "action",
          t: "+10.4s",
          dur: 412,
          title: "tool_call · weather.brief",
          why: "Brief template requires weather block.",
          detail: "Returned: 11°C, light rain 30%, sunset 20:14.",
          refs: [{ k: "tool", v: "weather.brief" }],
          state: "done",
          outcome: "11°C · light rain · sunset 20:14",
        },
        {
          id: "s6",
          kind: "action",
          t: "+10.8s",
          dur: 6200,
          title: "tool_call · calendar.day_agenda · retry 1/2",
          why: "Backoff window elapsed. Same args, fresh connection.",
          detail: "In flight…",
          refs: [
            { k: "tool", v: "calendar.day_agenda" },
            { k: "attempt", v: "2 of 3" },
          ],
          state: "running",
        },
        {
          id: "s7",
          kind: "decision",
          t: "—",
          dur: null,
          title: "Compose brief",
          why: "Pending: needs agenda block before render.",
          detail: "—",
          refs: [],
          state: "pending",
        },
        {
          id: "s8",
          kind: "action",
          t: "—",
          dur: null,
          title: "tool_call · push.deliver",
          why: "Deliver brief to operator phone.",
          detail: "—",
          refs: [{ k: "tool", v: "push.deliver" }],
          state: "pending",
        },
      ],
    },
  ],
  checkpoints: [
    {
      id: "ck_01",
      t: "+0.00s",
      label: "Task armed",
      summary: "scheduler.fired · template v4 · args frozen.",
      state: "committed",
    },
    {
      id: "ck_02",
      t: "+0.04s",
      label: "Plan committed",
      summary: "5-step plan persisted to journal.",
      state: "committed",
    },
    {
      id: "ck_03",
      t: "+10.4s",
      label: "Acquire phase done",
      summary: "mail+weather complete; calendar pending retry.",
      state: "committed",
      current: true,
    },
  ],
  context: {
    inputs: [
      { k: "cron", v: "weekday@09:39" },
      { k: "profile", v: "operator.default" },
      { k: "window", v: "06:00–11:00 local" },
      { k: "template", v: "morning_brief.v4" },
    ],
    state: [
      { k: "inbox.snapshot", v: "14 unread · 4 actionable" },
      { k: "weather.brief", v: "11°C · rain 30%" },
      { k: "calendar.day", v: "pending · retry queued" },
    ],
    external: [
      { k: "gmail", v: "1 call · 2.31s · ok" },
      { k: "gcal", v: "2 calls · 1 timeout · retrying" },
      { k: "weather", v: "1 call · 0.41s · ok" },
    ],
  },
};

const TASK_BLOCKED: Task = {
  ...TASK_RUNNING,
  status: "blocked",
  task_id: "run_01JH7C9PR",
  trace_id: "3f9e…b214",
  name: "unlock_door",
  goal: "Unlock front door for arriving guest (intent from operator chat).",
  startedAt: "09:41:02",
  elapsedMs: 47_000,
  etaMs: null,
  stepIdx: 2,
  stepTotal: 3,
  causedBy: "operator · chat intent",
  phases: [
    {
      id: "p_dispatch",
      label: "Dispatch",
      collapsed: false,
      steps: [
        {
          id: "b1",
          kind: "decision",
          t: "+0.00s",
          dur: 38,
          title: "Plan: unlock front lock",
          why: "Intent parsed as home.lock.unlock(front). High-trust operator phrasing.",
          detail: "Confidence 0.97 · no ambiguity.",
          refs: [{ k: "intent", v: "home.lock.unlock" }],
          state: "done",
        },
        {
          id: "b2",
          kind: "decision",
          t: "+0.05s",
          dur: 12,
          title: "Route: gated lane",
          why: "Action exceeds A3 home-device scope. Approval required below A4.",
          detail: "Policy: gate.home.lock.unlock@A<=3.",
          refs: [{ k: "policy", v: "gate.home.lock.unlock" }],
          state: "done",
        },
        {
          id: "b3",
          kind: "intervention",
          t: "+0.06s",
          dur: null,
          title: "Awaiting operator approval",
          why: "Gate policy requires Face ID approval. Notification dispatched.",
          detail: "Approval id apr_01JH7A4K · expires in 04:13.",
          refs: [{ k: "approval", v: "apr_01JH7A4K" }],
          state: "waiting",
        },
      ],
    },
  ],
  checkpoints: [
    {
      id: "ck_b1",
      t: "+0.00s",
      label: "Intent received",
      summary: "parsed · home.lock.unlock(front)",
      state: "committed",
    },
    {
      id: "ck_b2",
      t: "+0.06s",
      label: "Gate opened",
      summary: "awaiting approval apr_01JH7A4K",
      state: "committed",
      current: true,
    },
  ],
};

const TASK_FAILED: Task = {
  ...TASK_RUNNING,
  status: "failed",
  elapsedMs: 96_000,
  etaMs: null,
  stepIdx: 5,
  failedStepId: "s6f",
  phases: [
    { ...TASK_RUNNING.phases[0]! },
    {
      id: "p_compose",
      label: "Compose & deliver",
      collapsed: false,
      steps: [
        { ...TASK_RUNNING.phases[1]!.steps[0]! },
        {
          id: "s6f",
          kind: "action" as StepKind,
          t: "+10.8s",
          dur: 8200,
          title: "tool_call · calendar.day_agenda · retry 2/2",
          why: "Backoff window elapsed. Same args, fresh connection.",
          detail:
            "All 3 attempts (8.0s, 8.0s, 8.2s) timed out. Connector status: degraded.",
          refs: [
            { k: "tool", v: "calendar.day_agenda" },
            { k: "attempt", v: "3 of 3" },
          ],
          state: "failed" as StepState,
          error: "timeout · gcal upstream unreachable · max retries exhausted",
        },
        {
          id: "s7f",
          kind: "decision" as StepKind,
          t: "+24.6s",
          dur: 4,
          title: "Halt: required input missing",
          why: "Compose step depends on calendar.day_agenda · template enforces hard requirement.",
          detail: "Task halted at compose · last good checkpoint: ck_03.",
          refs: [{ k: "policy", v: "halt.on_missing_required" }],
          state: "done" as StepState,
        },
      ],
    },
  ],
};

const TASK_DONE: Task = {
  ...TASK_RUNNING,
  status: "completed",
  elapsedMs: 18_400,
  etaMs: null,
  stepIdx: 5,
  stepTotal: 5,
  phases: [
    {
      ...TASK_RUNNING.phases[0]!,
      collapsed: true,
      steps: TASK_RUNNING.phases[0]!.steps.map((s) => ({
        ...s,
        state: "done" as StepState,
        error: undefined,
      })),
    },
    {
      id: "p_compose",
      label: "Compose & deliver",
      collapsed: false,
      steps: [
        { ...TASK_RUNNING.phases[1]!.steps[0]!, state: "done" as StepState },
        {
          ...TASK_RUNNING.phases[1]!.steps[1]!,
          state: "done" as StepState,
          dur: 1840,
          title: "tool_call · calendar.day_agenda · retry 1/2",
          outcome: "6 events · next at 10:30 (standup)",
        },
        {
          ...TASK_RUNNING.phases[1]!.steps[2]!,
          state: "done" as StepState,
          t: "+12.4s",
          dur: 280,
          outcome: "rendered · 4 sections",
        },
        {
          ...TASK_RUNNING.phases[1]!.steps[3]!,
          state: "done" as StepState,
          t: "+12.7s",
          dur: 142,
          outcome: "delivered · operator.default",
        },
      ],
    },
  ],
};

const MOCK_TASKS: Record<string, Task> = {
  running: TASK_RUNNING,
  blocked: TASK_BLOCKED,
  failed: TASK_FAILED,
  done: TASK_DONE,
};

// ─── Meta maps ────────────────────────────────────────────────────────────────

const STATUS_META: Record<TaskStatus, { label: string; sub: string }> = {
  running: { label: "RUNNING", sub: "live · streaming" },
  waiting: { label: "WAITING", sub: "awaiting upstream" },
  blocked: { label: "BLOCKED", sub: "awaiting operator" },
  failed: { label: "FAILED", sub: "halted · last ck retained" },
  completed: { label: "COMPLETED", sub: "all steps · ok" },
};

const KIND_META: Record<StepKind, { glyph: string; label: string }> = {
  decision: { glyph: "◇", label: "DECISION" },
  action: { glyph: "▶", label: "ACTION" },
  intervention: { glyph: "◆", label: "OPERATOR" },
};

// ─── StyleSheet (animated values: progress fill/pulse require Animated.Value opacity) ─

const S = StyleSheet.create({
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  progressPulseDot: {
    position: "absolute",
    top: -3,
    bottom: -3,
    width: 12,
    borderRadius: 999,
  },
});

// ─── Atoms ────────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: TaskStatus }) {
  const { colors } = useTheme<Theme>();
  const color =
    status === "running"
      ? colors.accent
      : status === "failed"
        ? colors.error
        : status === "completed"
          ? colors.success
          : colors.warning;
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: color,
      }}
    />
  );
}

function RefPillInline({ k, v }: { k: string; v: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.elementBg,
        borderRadius: 5,
        paddingRight: 6,
        paddingLeft: 2,
        paddingVertical: 2,
        gap: 4,
      }}
    >
      <View
        style={{
          backgroundColor: colors.background,
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 3,
        }}
      >
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            fontWeight: "700",
            color: colors.foreground,
            letterSpacing: 0.3,
          }}
        >
          {k}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          color: colors.muted,
          letterSpacing: 0.2,
        }}
      >
        {v}
      </Text>
    </View>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const { colors } = useTheme<Theme>();
  const [color, bg] =
    level === "low"
      ? [colors.success, colors.successSubtle]
      : level === "medium"
        ? [colors.warning, colors.warningSubtle]
        : level === "critical"
          ? [colors.white, colors.error]
          : [colors.error, colors.errorSubtle];
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 5,
        backgroundColor: bg,
      }}
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color,
        }}
      >
        {level}
      </Text>
    </View>
  );
}

function StatePill({ state }: { state: StepState }) {
  const { colors } = useTheme<Theme>();
  const [color, bg, label] =
    state === "running"
      ? [colors.accent, colors.accentSubtle, "running"]
      : state === "failed"
        ? [colors.error, colors.errorSubtle, "failed"]
        : state === "waiting"
          ? [colors.warning, colors.warningSubtle, "waiting"]
          : state === "pending"
            ? [colors.muted, colors.elementBg, "queued"]
            : [colors.success, colors.successSubtle, "ok"];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: bg,
      }}
    >
      {state === "running" && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      )}
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0.7,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── StepNode ─────────────────────────────────────────────────────────────────

function StepNode({
  step,
  isFirst,
  isLast,
  isFailedTarget,
  expanded,
  onToggle,
}: {
  step: TaskStep;
  isFirst: boolean;
  isLast: boolean;
  isFailedTarget: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme<Theme>();
  const meta = KIND_META[step.kind];
  const [glyphColor, glyphBg] =
    step.kind === "decision"
      ? [colors.accent, colors.accentSubtle]
      : step.kind === "action"
        ? [colors.success, colors.successSubtle]
        : [colors.stageOperator, colors.stageOperatorSubtle];

  return (
    <View style={{ flexDirection: "row" }}>
      {/* Left rail */}
      <View style={{ width: 32, alignItems: "center", position: "relative" }}>
        {/* Connector from top to glyph — left:15 centers it in the 32px rail */}
        {!isFirst && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 15,
              width: 1,
              height: 14,
              backgroundColor: colors.border,
            }}
          />
        )}
        {/* Glyph */}
        <View
          style={{
            marginTop: 14,
            width: 22,
            height: 22,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: glyphBg,
            ...(isFailedTarget && {
              shadowColor: colors.error,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }),
          }}
        >
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 12,
              fontWeight: "600",
              color: glyphColor,
            }}
          >
            {meta.glyph}
          </Text>
        </View>
        {/* Connector from glyph to bottom */}
        {!isLast && (
          <View
            style={{
              flex: 1,
              width: 1,
              marginTop: 4,
              backgroundColor: colors.border,
            }}
          />
        )}
      </View>

      {/* Right body */}
      <View style={{ flex: 1, paddingBottom: 12 }}>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => ({
            paddingLeft: 8,
            paddingRight: 12,
            paddingTop: 10,
            opacity: pressed ? 0.8 : 1,
            gap: 4,
          })}
        >
          {/* Row 1: kind, timestamp, duration, state pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: glyphColor,
              }}
            >
              {meta.label}
            </Text>
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                color: colors.muted,
                letterSpacing: 0.5,
              }}
            >
              {step.t}
            </Text>
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                color: colors.foreground,
                opacity: 0.85,
              }}
            >
              {fmtMs(step.dur)}
            </Text>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <StatePill state={step.state} />
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              lineHeight: 18,
              color:
                step.state === "pending" ? colors.muted : colors.foreground,
            }}
          >
            {step.title}
          </Text>

          {/* Outcome */}
          {step.outcome && step.state === "done" && (
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                color: colors.success,
                letterSpacing: 0.1,
              }}
            >
              → {step.outcome}
            </Text>
          )}

          {/* Error */}
          {step.error && (
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                color: colors.error,
                letterSpacing: 0.1,
              }}
            >
              ⨯ {step.error}
            </Text>
          )}

          {/* WHY peek */}
          {step.why ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
                padding: 6,
                borderRadius: 7,
                backgroundColor: colors.elementBg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1,
                  color: colors.accent,
                  flexShrink: 0,
                }}
              >
                WHY
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: colors.foreground,
                  opacity: 0.85,
                }}
                numberOfLines={expanded ? undefined : 1}
              >
                {step.why}
              </Text>
              <SymbolView
                name={sym("chevron.down")}
                size={11}
                tintColor={colors.muted}
                style={{
                  transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                  flexShrink: 0,
                }}
              />
            </View>
          ) : null}
        </Pressable>

        {/* Expanded detail */}
        {expanded && step.why ? (
          <View
            style={{
              marginLeft: 8,
              marginRight: 12,
              marginTop: -4,
              marginBottom: 4,
              padding: 11,
              borderRadius: 8,
              backgroundColor: colors.accentSubtle06,
              borderWidth: 1,
              borderColor: colors.accentSubtle20,
              gap: 9,
            }}
          >
            <View style={{ gap: 3 }}>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: colors.muted,
                }}
              >
                Reasoning
              </Text>
              <Text
                style={{ fontSize: 12, lineHeight: 17, color: colors.foreground }}
              >
                {step.why}
              </Text>
            </View>
            <View style={{ gap: 3 }}>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: colors.muted,
                }}
              >
                Detail
              </Text>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  lineHeight: 16,
                  color: colors.foreground,
                }}
              >
                {step.detail}
              </Text>
            </View>
            {step.refs.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                {step.refs.map((r, i) => (
                  <RefPillInline key={i} k={r.k} v={r.v} />
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── PhaseBlock ───────────────────────────────────────────────────────────────

function PhaseBlock({
  phase,
  phaseIndex,
  expandedSteps,
  onToggleStep,
  failedStepId,
}: {
  phase: TaskPhase;
  phaseIndex: number;
  expandedSteps: Set<string>;
  onToggleStep: (id: string) => void;
  failedStepId?: string;
}) {
  const { colors } = useTheme<Theme>();
  const [collapsed, setCollapsed] = useState(phase.collapsed);
  const doneCount = phase.steps.filter((s) => s.state === "done").length;

  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {/* Phase header */}
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 9,
          backgroundColor: colors.elementBg,
          borderBottomWidth: collapsed ? 0 : 1,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 0.6,
            color: colors.accent,
          }}
        >
          PHASE · {String(phaseIndex + 1).padStart(2, "0")}
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: "500",
            color: colors.foreground,
          }}
        >
          {phase.label}
        </Text>
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: colors.background,
          }}
        >
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: 0.4,
              color: colors.muted,
            }}
          >
            {doneCount}/{phase.steps.length}
          </Text>
        </View>
        <SymbolView
          name={sym("chevron.down")}
          size={13}
          tintColor={colors.muted}
          style={{
            transform: [{ rotate: collapsed ? "-90deg" : "0deg" }],
          }}
        />
      </Pressable>

      {/* Steps */}
      {!collapsed && (
        <View style={{ paddingVertical: 4 }}>
          {phase.steps.map((step, idx) => (
            <StepNode
              key={step.id}
              step={step}
              isFirst={idx === 0}
              isLast={idx === phase.steps.length - 1}
              isFailedTarget={step.id === failedStepId}
              expanded={expandedSteps.has(step.id)}
              onToggle={() => onToggleStep(step.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────

function HeroSection({
  task,
  onJumpNow,
  onCopyTrace,
}: {
  task: Task;
  onJumpNow: () => void;
  onCopyTrace: () => void;
}) {
  const { colors } = useTheme<Theme>();
  const st = STATUS_META[task.status];
  const pct = Math.min(100, (task.stepIdx / task.stepTotal) * 100);

  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (task.status !== "running") {
      pulseAnim.setValue(0.6);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [task.status, pulseAnim]);

  const statusColor =
    task.status === "running"
      ? colors.accent
      : task.status === "failed"
        ? colors.error
        : task.status === "completed"
          ? colors.success
          : colors.warning;

  const progressColor =
    task.status === "failed"
      ? colors.error
      : task.status === "completed"
        ? colors.success
        : task.status === "blocked" || task.status === "waiting"
          ? colors.warning
          : colors.accent;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 12,
      }}
    >
      {/* Status row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <StatusDot status={task.status} />
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 1.2,
            color: statusColor,
          }}
        >
          {st.label}
        </Text>
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: 0.4,
            color: colors.muted,
          }}
        >
          {st.sub}
        </Text>
        {/* Trace ID pill */}
        <Pressable
          onPress={onCopyTrace}
          style={({ pressed }) => ({
            marginLeft: "auto",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.accentSubtle,
            borderWidth: 1,
            borderColor: colors.accentSubtle20,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 7,
            paddingRight: 4,
            borderRadius: 999,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: colors.accent,
              letterSpacing: 0.3,
            }}
          >
            ⌁ {task.trace_id}
          </Text>
          <View
            style={{
              backgroundColor: colors.accentSubtle20,
              paddingHorizontal: 5,
              paddingVertical: 3,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                fontWeight: "500",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              copy
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Name row */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 22,
            fontWeight: "600",
            letterSpacing: -0.2,
            color: colors.foreground,
          }}
        >
          {task.name}
        </Text>
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: colors.muted,
            letterSpacing: 0.4,
          }}
        >
          {task.task_id}
        </Text>
      </View>

      {/* Goal */}
      <Text
        style={{ fontSize: 12, lineHeight: 18, color: colors.muted }}
      >
        {task.goal}
      </Text>

      {/* Progress bar */}
      <View style={{ gap: 6 }}>
        <View
          style={{
            height: 6,
            backgroundColor: colors.elementBg,
            borderRadius: 999,
            overflow: "visible",
            position: "relative",
          }}
        >
          <View
            style={[
              S.progressFill,
              {
                width: `${pct}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
          {task.status === "running" && (
            <Animated.View
              style={[
                S.progressPulseDot,
                {
                  left: `${pct}%`,
                  transform: [{ translateX: -6 }],
                  opacity: pulseAnim,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          )}
        </View>

        {/* Progress meta */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: colors.muted,
            }}
          >
            STEP{" "}
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              {task.stepIdx}
            </Text>
            /{task.stepTotal}
          </Text>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.border, opacity: 0.6 }}>
            ·
          </Text>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
            elapsed{" "}
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              {fmtMs(task.elapsedMs)}
            </Text>
          </Text>
          {task.etaMs != null && (
            <>
              <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.border, opacity: 0.6 }}>
                ·
              </Text>
              <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
                eta{" "}
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  ~{fmtMs(task.etaMs)}
                </Text>
              </Text>
            </>
          )}
          <Pressable
            onPress={onJumpNow}
            style={({ pressed }) => ({
              marginLeft: "auto",
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 5,
              backgroundColor: colors.accentSubtle,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                fontWeight: "500",
                letterSpacing: 0.4,
                color: colors.accent,
              }}
            >
              jump to now ↓
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Meta pills */}
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <RefPillInline k="started" v={task.startedAt} />
        <RefPillInline k="cause" v={task.causedBy} />
        <RiskBadge level={task.risk_level} />
        <AutonomyPill level={task.autonomy_level} />
      </View>
    </View>
  );
}

// ─── FailureCard ─────────────────────────────────────────────────────────────

function FailureCard({
  task,
  onWhereItBroke,
  onRetry,
}: {
  task: Task;
  onWhereItBroke: () => void;
  onRetry: () => void;
}) {
  const { colors } = useTheme<Theme>();
  const failedStep = task.phases
    .flatMap((p) => p.steps)
    .find((s) => s.state === "failed");
  if (!failedStep) return null;

  return (
    <View
      style={{
        backgroundColor: colors.errorSubtle10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.failCardBorder,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: colors.error,
          }}
        >
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 1.4,
              color: colors.white,
            }}
          >
            FAILURE
          </Text>
        </View>
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: colors.muted,
            marginLeft: "auto",
          }}
        >
          {failedStep.t} · {fmtMs(failedStep.dur)}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
        {failedStep.title}
      </Text>
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          lineHeight: 16,
          color: colors.error,
          letterSpacing: 0.1,
        }}
      >
        {failedStep.error ?? "Step did not complete."}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        <Pressable
          onPress={onWhereItBroke}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: colors.errorSubtle,
            borderWidth: 1,
            borderColor: colors.failCardBorder,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: colors.error }}
          >
            Where it broke
          </Text>
        </Pressable>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: colors.accentSubtle,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <SymbolView
            name={sym("arrow.counterclockwise")}
            size={12}
            tintColor={colors.accent}
          />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}
          >
            Retry from ck_03
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── BlockedCard ─────────────────────────────────────────────────────────────

function BlockedCard({
  task,
  onApprove,
  onDecline,
}: {
  task: Task;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const { colors } = useTheme<Theme>();
  const gateStep = task.phases
    .flatMap((p) => p.steps)
    .find((s) => s.state === "waiting");
  const approvalRef = gateStep?.refs.find((r) => r.k === "approval");

  return (
    <View
      style={{
        backgroundColor: colors.warningSubtle10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.blockCardBorder,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: colors.warning,
          }}
        >
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 1.4,
              color: "#1c1300",
            }}
          >
            GATE OPEN
          </Text>
        </View>
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: "500",
            color: colors.warning,
            marginLeft: "auto",
          }}
        >
          expires in 04:13
        </Text>
      </View>
      <Text style={{ fontSize: 12, lineHeight: 18, color: colors.foreground }}>
        Waiting on operator approval ·{" "}
        <Text style={{ fontFamily: monoFont }}>{approvalRef?.v ?? "—"}</Text>.
        {"\n"}Task is paused at{" "}
        <Text style={{ fontFamily: monoFont, color: colors.accent }}>
          step {task.stepIdx}/{task.stepTotal}
        </Text>
        ; no side-effects until approved.
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        <Pressable
          onPress={onApprove}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: colors.successSubtle,
            borderWidth: 1,
            borderColor: colors.success,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <SymbolView
            name={sym("faceid")}
            size={14}
            tintColor={colors.success}
          />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: colors.success }}
          >
            Approve · Face ID
          </Text>
        </Pressable>
        <Pressable
          onPress={onDecline}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}
          >
            Decline
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

const TABS: { key: TabView; label: string; icon: SymbolViewProps["name"] }[] = [
  { key: "trace", label: "Trace", icon: sym("waveform") },
  { key: "checkpoints", label: "Checkpoints", icon: sym("clock.arrow.circlepath") },
  { key: "context", label: "Context", icon: sym("cpu") },
];

function TabBar({
  active,
  onChange,
}: {
  active: TabView;
  onChange: (t: TabView) => void;
}) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.elementBg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 3,
        gap: 2,
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              height: 30,
              borderRadius: 7,
              backgroundColor: isActive ? colors.card : "transparent",
              ...(isActive && {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 1,
              }),
            }}
          >
            <SymbolView
              name={tab.icon}
              size={12}
              tintColor={isActive ? colors.foreground : colors.muted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: isActive ? colors.foreground : colors.muted,
                letterSpacing: 0.2,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── TraceFilterBar ───────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All steps" },
  { key: "decision", label: "◇ Decisions" },
  { key: "action", label: "▶ Actions" },
  { key: "intervention", label: "◆ Operator" },
  { key: "failed", label: "Failures" },
];

function TraceFilterBar({
  filter,
  onChange,
}: {
  filter: FilterKey;
  onChange: (f: FilterKey) => void;
}) {
  const { colors } = useTheme<Theme>();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 14 }}
      style={{ marginHorizontal: -14 }}
    >
      {FILTERS.map((f) => {
        const isActive = filter === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: isActive ? colors.foreground : colors.elementBg,
              borderWidth: 1,
              borderColor: isActive ? colors.foreground : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: f.key !== "all" ? monoFont : undefined,
                fontSize: f.key !== "all" ? 10 : 11,
                fontWeight: "500",
                letterSpacing: f.key !== "all" ? 0.4 : 0,
                color: isActive ? colors.background : colors.muted,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── TraceView ────────────────────────────────────────────────────────────────

function TraceView({
  task,
  filter,
  onFilterChange,
  expandedSteps,
  onToggleStep,
}: {
  task: Task;
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  expandedSteps: Set<string>;
  onToggleStep: (id: string) => void;
}) {
  const { colors } = useTheme<Theme>();

  const visiblePhases = useMemo(() => {
    if (filter === "all") return task.phases;
    return task.phases
      .map((p) => ({
        ...p,
        steps: p.steps.filter((s) => {
          if (filter === "failed") return s.state === "failed";
          return s.kind === filter;
        }),
      }))
      .filter((p) => p.steps.length > 0);
  }, [filter, task.phases]);

  const tailCopy =
    task.status === "running"
      ? "tail · streaming"
      : task.status === "completed"
        ? `end of trace · ${task.phases.flatMap((p) => p.steps).length} steps`
        : task.status === "failed"
          ? "halted · last good ck_03"
          : "paused at gate · awaiting approval";

  return (
    <View style={{ gap: 10 }}>
      <TraceFilterBar filter={filter} onChange={onFilterChange} />

      {visiblePhases.map((phase, idx) => (
        <PhaseBlock
          key={phase.id}
          phase={phase}
          phaseIndex={idx}
          expandedSteps={expandedSteps}
          onToggleStep={onToggleStep}
          failedStepId={task.failedStepId}
        />
      ))}

      {visiblePhases.length === 0 && (
        <View
          style={{
            padding: 24,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted }}>
            No steps match this filter.
          </Text>
        </View>
      )}

      {/* Trace tail */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 8,
        }}
      >
        {task.status === "running" && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.accent,
            }}
          />
        )}
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: "500",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.muted,
          }}
        >
          {tailCopy}
        </Text>
      </View>
    </View>
  );
}

// ─── CheckpointsView ─────────────────────────────────────────────────────────

function CheckpointsView({
  task,
  onAction,
}: {
  task: Task;
  onAction: (a: string) => void;
}) {
  const { colors } = useTheme<Theme>();
  const defaultSelected =
    task.checkpoints.find((c) => c.current)?.id ??
    task.checkpoints[task.checkpoints.length - 1]?.id ??
    "";
  const [selected, setSelected] = useState(defaultSelected);

  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          lineHeight: 16,
          color: colors.muted,
          paddingHorizontal: 4,
        }}
      >
        Snapshots of state. Tap to inspect · long-press to compare two.
      </Text>

      <View>
        {task.checkpoints.map((ck, i) => {
          const isSelected = selected === ck.id;
          const isLast = i === task.checkpoints.length - 1;
          return (
            <Pressable
              key={ck.id}
              onPress={() => setSelected(ck.id)}
              style={{ flexDirection: "row" }}
            >
              {/* Rail */}
              <View
                style={{
                  width: 28,
                  alignItems: "center",
                  paddingTop: 13,
                }}
              >
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: ck.current
                      ? colors.accent
                      : isSelected
                        ? colors.foreground
                        : "transparent",
                    borderWidth: ck.current ? 0 : 1.5,
                    borderColor: ck.current ? "transparent" : colors.muted,
                    ...(ck.current && {
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4,
                    }),
                  }}
                />
                {!isLast && (
                  <View
                    style={{
                      flex: 1,
                      width: 1,
                      marginTop: 4,
                      backgroundColor: colors.border,
                    }}
                  />
                )}
              </View>

              {/* Body card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isSelected
                    ? colors.accentSubtle06
                    : colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.border,
                  padding: 10,
                  margin: 4,
                  marginLeft: 0,
                  gap: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      fontWeight: "600",
                      letterSpacing: 0.4,
                      color: colors.foreground,
                    }}
                  >
                    {ck.id}
                  </Text>
                  <Text
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      color: colors.muted,
                    }}
                  >
                    {ck.t}
                  </Text>
                  {ck.current && (
                    <View
                      style={{
                        marginLeft: "auto",
                        backgroundColor: colors.accentSubtle,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: monoFont,
                          fontSize: 9,
                          fontWeight: "600",
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          color: colors.accent,
                        }}
                      >
                        at this point
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  {ck.label}
                </Text>
                <Text
                  style={{
                    fontFamily: monoFont,
                    fontSize: 11,
                    lineHeight: 16,
                    color: colors.muted,
                  }}
                >
                  {ck.summary}
                </Text>

                {/* Actions on selection */}
                {isSelected && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Pressable
                      onPress={() => onAction("inspect")}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: colors.accentSubtle,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <SymbolView
                        name={sym("eye")}
                        size={11}
                        tintColor={colors.accent}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: colors.accent,
                        }}
                      >
                        Inspect
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onAction("compare")}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <SymbolView
                        name={sym("plus")}
                        size={11}
                        tintColor={colors.foreground}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "500",
                          color: colors.foreground,
                        }}
                      >
                        Compare
                      </Text>
                    </Pressable>
                    {!ck.current && (
                      <Pressable
                        onPress={() => onAction("rewind")}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 6,
                          backgroundColor: colors.errorSubtle,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <SymbolView
                          name={sym("arrow.counterclockwise")}
                          size={11}
                          tintColor={colors.error}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: colors.error,
                          }}
                        >
                          Rewind here
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── ContextView ─────────────────────────────────────────────────────────────

function ContextPanel({
  label,
  rows,
}: {
  label: string;
  rows: TaskContextRow[];
}) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: colors.muted,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            gap: 10,
            paddingVertical: 5,
            borderBottomWidth: i < rows.length - 1 ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: 0.2,
              color: colors.muted,
              width: 96,
              flexShrink: 0,
            }}
          >
            {row.k}
          </Text>
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 11,
              flex: 1,
              color: colors.foreground,
            }}
          >
            {row.v}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ContextView({ task }: { task: Task }) {
  return (
    <View style={{ gap: 10 }}>
      <ContextPanel label="Inputs" rows={task.context.inputs} />
      <ContextPanel label="Memory & state" rows={task.context.state} />
      <ContextPanel label="External calls" rows={task.context.external} />
    </View>
  );
}

// ─── BottomBar ────────────────────────────────────────────────────────────────

function BottomBar({
  task,
  onAction,
  bottomInset,
}: {
  task: Task;
  onAction: (a: string) => void;
  bottomInset: number;
}) {
  const { colors } = useTheme<Theme>();
  const isLive =
    task.status === "running" ||
    task.status === "waiting" ||
    task.status === "blocked";

  return (
    <View
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: bottomInset + 20,
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 10,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      }}
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        {isLive ? (
          <>
            <Pressable
              onPress={() => onAction("pause")}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SymbolView
                name={sym("pause.fill")}
                size={12}
                tintColor={colors.foreground}
              />
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}
              >
                Pause
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onAction("cancel")}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 38,
                borderRadius: 10,
                backgroundColor: colors.errorSubtle,
                borderWidth: 1,
                borderColor: colors.failCardBorder,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SymbolView
                name={sym("xmark")}
                size={12}
                tintColor={colors.error}
              />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.error }}
              >
                Cancel
              </Text>
            </Pressable>
          </>
        ) : task.status === "failed" ? (
          <>
            <Pressable
              onPress={() => onAction("inspect")}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SymbolView
                name={sym("magnifyingglass")}
                size={12}
                tintColor={colors.foreground}
              />
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}
              >
                Diagnose
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onAction("retry")}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 38,
                borderRadius: 10,
                backgroundColor: colors.accent,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SymbolView
                name={sym("arrow.counterclockwise")}
                size={12}
                tintColor={colors.white}
              />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.white }}
              >
                Retry from ck_03
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => onAction("replay")}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SymbolView
                name={sym("arrow.counterclockwise")}
                size={12}
                tintColor={colors.foreground}
              />
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}
              >
                Replay
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onAction("rerun")}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SymbolView
                name={sym("play.fill")}
                size={12}
                tintColor={colors.foreground}
              />
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}
              >
                Run again
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9.5,
          lineHeight: 14,
          textAlign: "center",
          letterSpacing: 0.2,
          color: colors.muted,
        }}
      >
        Operator actions are logged to{" "}
        <Text style={{ fontFamily: monoFont, color: colors.accent }}>
          ⌁ {task.trace_id}
        </Text>{" "}
        and require Face ID for autonomy changes.
      </Text>
    </View>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, bottomInset }: { message: string; bottomInset: number }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        position: "absolute",
        alignSelf: "center",
        bottom: bottomInset + 120,
        backgroundColor: colors.foreground,
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }}
      pointerEvents="none"
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          fontWeight: "500",
          letterSpacing: 0.2,
          color: colors.background,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 64;

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme<Theme>();
  const insets = useSafeAreaInsets();

  const task = MOCK_TASKS[id ?? ""] ?? TASK_RUNNING;

  const [view, setView] = useState<TabView>("trace");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toast, setToast] = useState<string | null>(null);

  const defaultExpanded = new Set<string>(
    task.status === "failed"
      ? [task.failedStepId ?? "s6f"]
      : task.status === "blocked"
        ? ["b3"]
        : ["s3"],
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(defaultExpanded);

  const scrollRef = useRef<ScrollView>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const onAction = (action: string) => {
    const messages: Record<string, string> = {
      pause: "Paused at next safe point.",
      cancel: "Cancel queued · awaiting Face ID.",
      retry: "Retrying from ck_03 · acquire phase preserved.",
      inspect: "Opening diagnostics…",
      replay: "Replaying trace as read-only.",
      rerun: "Re-running with frozen args.",
      compare: "Select a second checkpoint to compare.",
      rewind: "Rewind queued · awaiting Face ID.",
    };
    showToast(messages[action] ?? action);
  };

  const handleToggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const footerHeight = 38 + 6 + 14 + 20; // button + gap + hint + padding

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            height: HEADER_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            gap: 12,
          }}
        >
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
              flexShrink: 0,
            })}
          >
            <SymbolView
              name={sym("chevron.left")}
              size={16}
              tintColor={colors.foreground}
            />
          </Pressable>

          {/* Title block */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                letterSpacing: -0.2,
                color: colors.foreground,
                lineHeight: 22,
              }}
            >
              Task
            </Text>
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                color: colors.muted,
                letterSpacing: 0.2,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {task.name} · {task.task_id}
            </Text>
          </View>

          {/* More */}
          <Pressable
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
              flexShrink: 0,
            })}
          >
            <SymbolView
              name={sym("ellipsis")}
              size={15}
              tintColor={colors.foreground}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: footerHeight + insets.bottom + 40,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection
          task={task}
          onJumpNow={() => scrollRef.current?.scrollToEnd({ animated: true })}
          onCopyTrace={() => showToast(`Copied ⌁ ${task.trace_id}`)}
        />

        {task.status === "failed" && (
          <FailureCard
            task={task}
            onWhereItBroke={() => {
              setView("trace");
              setFilter("failed");
              showToast("Filtered to failures.");
            }}
            onRetry={() => onAction("retry")}
          />
        )}

        {task.status === "blocked" && (
          <BlockedCard
            task={task}
            onApprove={() => onAction("approve")}
            onDecline={() => showToast("Declined · task will cancel.")}
          />
        )}

        <TabBar active={view} onChange={setView} />

        {view === "trace" && (
          <TraceView
            task={task}
            filter={filter}
            onFilterChange={setFilter}
            expandedSteps={expandedSteps}
            onToggleStep={handleToggleStep}
          />
        )}

        {view === "checkpoints" && (
          <CheckpointsView task={task} onAction={onAction} />
        )}

        {view === "context" && <ContextView task={task} />}
      </ScrollView>

      {/* ── Floating bottom bar ──────────────────────────────────────── */}
      <BottomBar
        task={task}
        onAction={onAction}
        bottomInset={insets.bottom}
      />

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast != null && (
        <Toast message={toast} bottomInset={insets.bottom} />
      )}
    </View>
  );
}
