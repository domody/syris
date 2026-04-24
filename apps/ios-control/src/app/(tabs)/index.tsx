import { SymbolView } from "expo-symbols";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Middot } from "@/components/ui/mid-dot";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusDot } from "@/components/ui/status-dot";
import { TraceId } from "@/components/ui/trace-id";
import { Colors } from "@/constants/theme";
import { useSystemStore } from "@/stores/use-system-store";

const SPARKLINE_DATA = [
  8, 12, 10, 14, 18, 22, 19, 16, 20, 28, 34, 32, 30, 25, 22, 28, 36, 44, 40, 36,
  30, 24, 28, 33,
];

type AuditLevel = "info" | "warn" | "error";
type AuditRow = [string, AuditLevel, string, string];

const AUDIT_ROWS: AuditRow[] = [
  ["00:12:04", "info", "task.step.succeeded", "01JH7A4K6N"],
  ["00:12:03", "info", "route.matched", "01JH7A4K6N"],
  ["00:11:58", "warn", "handler.degraded", "01JH7A3WQ1"],
  ["00:11:41", "info", "event.normalized", "01JH7A3BXY"],
  ["00:11:02", "info", "approval.requested", "01JH7A3BXY"],
  ["00:10:44", "error", "tool.call.timeout", "01JH7A2KM3"],
];

type SubsystemEntry = {
  name: string;
  status: "healthy" | "degraded";
  iconIos: "house" | "calendar" | "envelope" | "sensor.tag.radiowaves.forward";
  iconAndroid: "home" | "calendar_today" | "mail" | "sensors";
  volume: string;
};

const SUBSYSTEMS: SubsystemEntry[] = [
  {
    name: "Home · HomeKit",
    status: "healthy",
    iconIos: "house",
    iconAndroid: "home",
    volume: "412/24h",
  },
  {
    name: "Calendar · iCloud",
    status: "healthy",
    iconIos: "calendar",
    iconAndroid: "calendar_today",
    volume: "31/24h",
  },
  {
    name: "Mail triage",
    status: "healthy",
    iconIos: "envelope",
    iconAndroid: "mail",
    volume: "78/24h",
  },
  {
    name: "Sensors · foyer",
    status: "degraded",
    iconIos: "sensor.tag.radiowaves.forward",
    iconAndroid: "sensors",
    volume: "1.1k/24h",
  },
];

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <View className="flex-row items-end gap-px" style={{ height: 44 }}>
      {data.map((v, i) => (
        <View
          key={i}
          className="flex-1 rounded-sm bg-blue-500/40 dark:bg-blue-400/40"
          style={{ height: (v / max) * 44 }}
        />
      ))}
    </View>
  );
}

function AutonomyPill({ level }: { level: string | null }) {
  if (!level) {
    return (
      <View className="flex-row items-center px-3 py-1 rounded-full border border-border bg-surface">
        <Text className="text-muted text-xs font-mono">— autonomy</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 dark:bg-blue-400/15">
      <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold font-mono">
        {level}
      </Text>
      <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
        scoped autonomy
      </Text>
    </View>
  );
}

function AuditLevelBadge({ level }: { level: AuditLevel }) {
  if (level === "error") return <Badge label="error" variant="error" />;
  if (level === "warn") return <Badge label="warn" variant="warning" />;
  return <Badge label="info" variant="neutral" />;
}

export default function OverviewScreen() {
  const { autonomyLevel, systemHealth } = useSystemStore();
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const healthLabel = systemHealth
    ? systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)
    : "Healthy";
  const healthDotVariant =
    systemHealth === "critical"
      ? "error"
      : systemHealth === "degraded"
        ? "warning"
        : "success";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between pt-3 pb-4">
          <View>
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              Overview
            </Text>
          </View>
          <AutonomyPill level={autonomyLevel} />
        </View>

        {/* ── System Health Hero ── */}
        <Card>
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1.5">
                <StatusDot variant={healthDotVariant} />
                <Text className="text-xs font-mono tracking-widest uppercase text-muted">
                  Entity online
                </Text>
              </View>
              <Text className="text-2xl font-semibold tracking-tight text-foreground">
                {healthLabel}
              </Text>
              <Text className="text-xs text-muted mt-1 font-mono">
                14d 03:22:07 <Middot /> 7 subsystems reachable
              </Text>
            </View>
          </View>

          <View className="mt-3.5">
            <View className="flex-row justify-between mb-1">
              <Text className="text-[10px] font-mono text-muted tracking-wider">
                PIPELINE <Middot /> 24H
              </Text>
              <Text className="text-[10px] font-mono text-muted">
                1,284 events <Middot /> 3 errors
              </Text>
            </View>
            <Sparkline data={SPARKLINE_DATA} />
            <View className="flex-row justify-between mt-1">
              {["00:00", "06:00", "12:00", "18:00", "NOW"].map((label) => (
                <Text key={label} className="text-[9px] font-mono text-muted">
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </Card>

        {/* ── Active Agents ── */}
        <SectionHeader
          title="Active agents"
          trailing={
            <Text className="text-xs font-mono text-muted">1 running</Text>
          }
        />

        <Pressable className="bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 rounded-xl p-4 active:opacity-70">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-2">
              <SymbolView
                name={{
                  ios: "arrow.triangle.2.circlepath",
                  android: "autorenew",
                  web: "autorenew",
                }}
                size={14}
                tintColor={colors.accent}
              />
              <Text className="text-xs font-mono tracking-wider text-muted">
                Agent <Middot /> morning_brief
              </Text>
            </View>
            <Text className="text-xs font-mono text-muted tabular-nums">
              00:47
            </Text>
          </View>

          <Text className="text-[15px] font-medium tracking-tight text-foreground mb-2">
            Drafting daily brief <Middot /> step 3 of 5
          </Text>

          <View className="h-1 bg-border rounded-full overflow-hidden mb-2.5">
            <View
              className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
              style={{ width: "60%" }}
            />
          </View>

          <View className="flex-row items-center gap-1.5">
            <Badge label="LLM" variant="info" />
            <Text className="text-[10px] font-mono text-muted">
              synthesizing calendar + mail triage
            </Text>
          </View>
        </Pressable>

        {/* ── Needs Attention ── */}
        <SectionHeader
          title="Needs attention"
          trailing={<Badge label="2 pending" variant="warning" />}
        />

        <View className="bg-surface rounded-xl overflow-hidden">
          {/* Approval row */}
          <Pressable className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
            <View className="w-9 h-9 rounded-xl bg-yellow-500/20 dark:bg-yellow-400/20 items-center justify-center">
              <SymbolView
                name={{
                  ios: "lock.shield",
                  android: "shield_lock",
                  web: "shield_lock",
                }}
                size={16}
                tintColor={colors.warning}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-medium text-foreground">
                Unlock front door <Middot /> Dad
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
                <Text className="text-xs font-mono text-muted">
                  apr_01JH7A4K
                </Text>
                <Text className="text-xs text-muted">
                  <Middot />
                </Text>
                <Text className="text-xs text-muted">approval required</Text>
                <Text className="text-xs text-muted">
                  <Middot />
                </Text>
                <Badge label="medium" variant="warning" />
              </View>
            </View>
            <Text className="text-xs text-muted">2m</Text>
          </Pressable>

          <View className="h-px bg-border mx-4" />

          {/* Escalation row */}
          <Pressable className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
            <View className="w-9 h-9 rounded-xl bg-blue-500/15 dark:bg-blue-400/15 items-center justify-center">
              <SymbolView
                name={{ ios: "brain", android: "memory", web: "memory" }}
                size={16}
                tintColor={colors.accent}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-medium text-foreground">
                Intent unclear <Middot /> garage SMS
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text className="text-xs font-mono text-muted">
                  esc_01JH7A9P
                </Text>
                <Text className="text-xs text-muted">
                  <Middot />
                </Text>
                <Text className="text-xs text-muted">
                  select interpretation
                </Text>
              </View>
            </View>
            <Text className="text-xs text-muted">6m</Text>
          </Pressable>
        </View>

        {/* ── Recent Activity ── */}
        <SectionHeader
          title="Recent activity"
          trailing={
            <Text className="text-xs font-mono text-blue-500 dark:text-blue-400">
              Tail →
            </Text>
          }
        />

        <View className="bg-surface rounded-xl px-3 py-1">
          {AUDIT_ROWS.map(([time, level, type, traceId], i) => (
            <View
              key={i}
              className={`flex-row items-center gap-2 py-2 ${i < AUDIT_ROWS.length - 1 ? "border-b border-border" : ""}`}
            >
              <Text className="text-[10px] font-mono text-muted w-14">
                {time}
              </Text>
              <AuditLevelBadge level={level} />
              <View className="flex-1 flex-row items-center gap-1 min-w-0 overflow-hidden">
                <Text
                  className="text-[10px] font-mono text-foreground shrink"
                  numberOfLines={1}
                >
                  {type} <Middot />{" "}
                </Text>
                <TraceId value={traceId} />
              </View>
            </View>
          ))}
        </View>

        {/* ── Subsystems ── */}
        <SectionHeader title="Subsystems" />

        <View className="bg-surface rounded-xl overflow-hidden">
          {SUBSYSTEMS.map((sys, i) => (
            <View key={i}>
              <Pressable className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
                <View className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 items-center justify-center">
                  <SymbolView
                    name={{
                      ios: sys.iconIos,
                      android: sys.iconAndroid,
                      web: sys.iconAndroid,
                    }}
                    size={15}
                    tintColor={colors.textSecondary}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {sys.name}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <StatusDot
                      variant={
                        sys.status === "degraded" ? "warning" : "success"
                      }
                    />
                    <Text className="text-xs text-muted">{sys.status}</Text>
                    <Text className="text-xs text-muted">
                      <Middot />
                    </Text>
                    <Text className="text-xs font-mono text-muted">
                      {sys.volume}
                    </Text>
                  </View>
                </View>
                <SymbolView
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                    web: "chevron_right",
                  }}
                  size={12}
                  tintColor={colors.textSecondary}
                />
              </Pressable>
              {i < SUBSYSTEMS.length - 1 && (
                <View className="h-px bg-border mx-4" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
