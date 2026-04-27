import { useTheme } from "@shopify/restyle";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Middot } from "@/components/mid-dot";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { monoFont, type Theme } from "@/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high" | "critical";
type FilterId = "all" | "action" | "agent" | "info" | "alarm";
type CardColors = Theme["colors"];

type ApprovalItem = {
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
type EscalationItem = {
  id: string;
  kind: "escalation";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  escalationId: string;
};
type AgentItem = {
  id: string;
  kind: "agent";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  runId: string;
  elapsed: string;
};
type InfoItem = {
  id: string;
  kind: "info";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  eventId: string;
};
type AlarmItem = {
  id: string;
  kind: "alarm";
  unread: boolean;
  time: string;
  title: string;
  snippet: string;
  alarmId: string;
  autocleared: boolean;
};
type InboxItem =
  | ApprovalItem
  | EscalationItem
  | AgentItem
  | InfoItem
  | AlarmItem;

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_INBOX: InboxItem[] = [
  {
    id: "n1",
    kind: "approval",
    unread: true,
    time: "2m",
    title: "Approval needed <Middot /> unlock door",
    snippet: "Dad requested front door unlock. Action exceeds A3 home-device scope.",
    approvalId: "apr_01JH7A4K",
    riskLevel: "medium",
    expiresIn: "3:47",
  },
  {
    id: "n2",
    kind: "escalation",
    unread: true,
    time: "6m",
    title: "Intent unclear <Middot /> garage SMS",
    snippet: '"yo can you close up when you leave" — 3 possible interpretations.',
    escalationId: "esc_01JH7A9P",
  },
  {
    id: "n3",
    kind: "agent",
    unread: true,
    time: "now",
    title: "morning_brief <Middot /> step 3/5",
    snippet: "Synthesizing calendar + mail triage. LLM involved.",
    runId: "run_01JH7B2QX",
    elapsed: "00:47",
  },
  {
    id: "n4",
    kind: "info",
    unread: false,
    time: "12m",
    title: "Motion <Middot /> foyer",
    snippet: "Detected while you were away. Matched expected pattern (cat).",
    eventId: "evt_01JH7A1K",
  },
  {
    id: "n5",
    kind: "info",
    unread: false,
    time: "24m",
    title: "Timer completed <Middot /> oven preheat",
    snippet: "Kitchen oven reached 425°F after 8m 14s. Announced on speakers.",
    eventId: "tmr_01JH79ZA",
  },
  {
    id: "n6",
    kind: "alarm",
    unread: false,
    time: "1h",
    title: "Alarm raised <Middot /> water leak sensor",
    snippet: "Basement sensor spiked. Resolved automatically after 40s.",
    alarmId: "alm_01JH78YC",
    autocleared: true,
  },
  {
    id: "n7",
    kind: "info",
    unread: false,
    time: "9h",
    title: "Scheduled rule fired",
    snippet: "bedtime.dim ran at 22:30. 4 lights dimmed to 15%.",
    eventId: "rule_bedtime.dim",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_VARIANT: Record<RiskLevel, BadgeVariant> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

function filterItems(items: InboxItem[], filter: FilterId): InboxItem[] {
  switch (filter) {
    case "action":
      return items.filter(
        (it) => it.kind === "approval" || it.kind === "escalation",
      );
    case "agent":
      return items.filter((it) => it.kind === "agent");
    case "info":
      return items.filter((it) => it.kind === "info");
    case "alarm":
      return items.filter((it) => it.kind === "alarm");
    default:
      return items;
  }
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function UnreadDot() {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        position: "absolute",
        width: 6,
        height: 6,
        borderRadius: 9999,
        backgroundColor: colors.info,
        left: 6,
        top: 22,
      }}
    />
  );
}

function LiveDot() {
  const { colors } = useTheme<Theme>();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 9999,
          backgroundColor: colors.info,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Card variants ────────────────────────────────────────────────────────────

function ApprovalCard({ item, colors }: { item: ApprovalItem; colors: CardColors }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        position: "relative",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {item.unread && <UnreadDot />}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.warningSubtle,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SymbolView
          name={{ ios: "lock.fill", android: "lock", web: "lock" }}
          size={16}
          tintColor={colors.warning}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "500", lineHeight: 18, color: colors.foreground }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{ fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2 }}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
            {item.approvalId}
          </Text>
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Badge label={item.riskLevel} variant={RISK_VARIANT[item.riskLevel]} />
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.warningMid }}>
            exp {item.expiresIn}
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted, flexShrink: 0, marginTop: 2 }}>
        {item.time}
      </Text>
    </Pressable>
  );
}

function EscalationCard({ item, colors }: { item: EscalationItem; colors: CardColors }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        position: "relative",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {item.unread && <UnreadDot />}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.accentSubtle,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SymbolView
          name={{ ios: "brain", android: "memory", web: "memory" }}
          size={16}
          tintColor={colors.accent}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "500", lineHeight: 18, color: colors.foreground }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{ fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2 }}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
            {item.escalationId}
          </Text>
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Text style={{ fontSize: 10, color: colors.muted }}>select interpretation</Text>
        </View>
      </View>
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted, flexShrink: 0, marginTop: 2 }}>
        {item.time}
      </Text>
    </Pressable>
  );
}

function AgentCard({ item, colors }: { item: AgentItem; colors: CardColors }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        position: "relative",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {item.unread && <UnreadDot />}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.accentSubtle20,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SymbolView
          name={{ ios: "arrow.triangle.2.circlepath", android: "autorenew", web: "autorenew" }}
          size={16}
          tintColor={colors.accent}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{ flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 18, color: colors.foreground }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <LiveDot />
        </View>
        <Text
          style={{ fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2 }}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>{item.runId}</Text>
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
            elapsed {item.elapsed}
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted, flexShrink: 0, marginTop: 2 }}>
        {item.time}
      </Text>
    </Pressable>
  );
}

function InfoCard({ item, colors }: { item: InfoItem; colors: CardColors }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        position: "relative",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {item.unread && <UnreadDot />}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.elementBgSubtle,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {item.eventId.startsWith("evt_") ? (
          <SymbolView
            name={{ ios: "sensor.tag.radiowaves.forward", android: "sensors", web: "sensors" }}
            size={16}
            tintColor={colors.muted}
          />
        ) : item.eventId.startsWith("tmr_") ? (
          <SymbolView
            name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
            size={16}
            tintColor={colors.muted}
          />
        ) : (
          <SymbolView
            name={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }}
            size={16}
            tintColor={colors.muted}
          />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "500", lineHeight: 18, color: colors.foreground }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{ fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2 }}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
            {item.eventId}
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted, flexShrink: 0, marginTop: 2 }}>
        {item.time}
      </Text>
    </Pressable>
  );
}

function AlarmCard({ item, colors }: { item: AlarmItem; colors: CardColors }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        position: "relative",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {item.unread && <UnreadDot />}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.errorSubtle,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SymbolView
          name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
          size={16}
          tintColor={colors.error}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "500", lineHeight: 18, color: colors.foreground }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{ fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2 }}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
            {item.alarmId}
          </Text>
          {item.autocleared && (
            <>
              <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
                <Middot />
              </Text>
              <Badge label="auto-cleared" variant="neutral" />
            </>
          )}
        </View>
      </View>
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted, flexShrink: 0, marginTop: 2 }}>
        {item.time}
      </Text>
    </Pressable>
  );
}

function InboxRow({
  item,
  colors,
  isLast,
}: {
  item: InboxItem;
  colors: CardColors;
  isLast: boolean;
}) {
  return (
    <>
      {item.kind === "approval" && <ApprovalCard item={item} colors={colors} />}
      {item.kind === "escalation" && <EscalationCard item={item} colors={colors} />}
      {item.kind === "agent" && <AgentCard item={item} colors={colors} />}
      {item.kind === "info" && <InfoCard item={item} colors={colors} />}
      {item.kind === "alarm" && <AlarmCard item={item} colors={colors} />}
      {!isLast && (
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 14 }} />
      )}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const FILTER_DEFS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Needs action" },
  { id: "agent", label: "Agents" },
  { id: "info", label: "Info" },
  { id: "alarm", label: "Alarms" },
];

export default function InboxScreen() {
  const { colors, borderRadii } = useTheme<Theme>();

  const [filter, setFilter] = useState<FilterId>("all");
  const [items, setItems] = useState<InboxItem[]>(INITIAL_INBOX);

  const visible = filterItems(items, filter);
  const unreadCount = items.filter((it) => it.unread).length;
  const hasInfo = items.some((it) => it.kind === "info");

  const countFor = (id: FilterId) => {
    switch (id) {
      case "action":
        return items.filter((it) => it.kind === "approval" || it.kind === "escalation").length;
      case "agent":
        return items.filter((it) => it.kind === "agent").length;
      case "info":
        return items.filter((it) => it.kind === "info").length;
      case "alarm":
        return items.filter((it) => it.kind === "alarm").length;
      default:
        return items.length;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{ fontSize: 24, fontWeight: "600", letterSpacing: -0.6, color: colors.foreground }}
          >
            Inbox
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: borderRadii.full,
                backgroundColor: colors.accentSubtle,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accentMid }}>
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}
        >
          {FILTER_DEFS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: borderRadii.md,
                  paddingHorizontal: 12,
                  flexShrink: 0,
                  height: 30,
                  backgroundColor: active ? colors.foreground : colors.elementBg,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: active ? colors.chipActiveText : colors.chipInactiveLabel,
                  }}
                >
                  {f.label}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: monoFont,
                    color: (active ? colors.chipActiveCount : colors.chipInactiveCount) as string,
                  }}
                >
                  {countFor(f.id)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Inbox list ── */}
        {visible.length > 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadii.xl,
              overflow: "hidden",
              marginHorizontal: 16,
            }}
          >
            {visible.map((item, i) => (
              <InboxRow
                key={item.id}
                item={item}
                colors={colors}
                isLast={i === visible.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64, marginHorizontal: 16 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Nothing here</Text>
          </View>
        )}

        {/* ── Clear informational ── */}
        {hasInfo && (
          <Pressable
            onPress={() => setItems((prev) => prev.filter((it) => it.kind !== "info"))}
            style={({ pressed }) => ({
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: borderRadii.full,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <SymbolView
              name={{ ios: "trash", android: "delete_outline", web: "delete_outline" }}
              size={12}
              tintColor={colors.muted}
            />
            <Text style={{ fontSize: 12, color: colors.muted }}>Clear all informational</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
