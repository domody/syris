import { useTheme } from "@shopify/restyle";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OutcomePill } from "@/components/audit-outcome-pill";
import { StageChip } from "@/components/audit-stage-chip";
import { formatTimestamp, stageColorKey } from "@/helpers/audit";
import { monoFont, type Theme } from "@/theme";
import type { AuditEvent } from "@/types/api/audit";

export function TraceDetail({
  traceId,
  events,
  onBack,
}: {
  traceId: string;
  events: AuditEvent[];
  onBack: () => void;
}) {
  const { colors } = useTheme<Theme>();
  const traceEvents = events
    .filter((e) => e.trace_id === traceId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const firstTs = traceEvents[0]
    ? new Date(traceEvents[0].timestamp).getTime()
    : 0;
  const lastTs = traceEvents[traceEvents.length - 1]
    ? new Date(traceEvents[traceEvents.length - 1]!.timestamp).getTime()
    : firstTs;
  const totalMs = lastTs - firstTs || 1;

  const successCount = traceEvents.filter(
    (e) => e.outcome === "success",
  ).length;
  const failCount = traceEvents.filter((e) => e.outcome === "failure").length;
  const totalLatency = traceEvents.reduce((s, e) => s + (e.latency_ms ?? 0), 0);
  const stages = Array.from(new Set(traceEvents.map((e) => e.stage)));

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Back header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 10,
        }}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <SymbolView
            name={{
              ios: "chevron.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            size={18}
            tintColor={colors.accent}
          />
        </Pressable>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
            flex: 1,
          }}
        >
          Trace
        </Text>
        <Text
          style={{ fontFamily: monoFont, fontSize: 12, color: colors.muted }}
        >
          {traceId}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Hero card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            gap: 12,
          }}
        >
          {/* Stage chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {stages.map((s) => (
              <StageChip key={s} stage={s} />
            ))}
          </View>

          {/* Waterfall bar */}
          <View style={{ gap: 4 }}>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.elementBg,
                flexDirection: "row",
                overflow: "hidden",
              }}
            >
              {traceEvents.map((e) => {
                const start =
                  (new Date(e.timestamp).getTime() - firstTs) / totalMs;
                const width = Math.max((e.latency_ms ?? 50) / totalMs, 0.03);
                const color = colors[stageColorKey(e.stage)] as string;
                return (
                  <View
                    key={e.audit_id}
                    style={{
                      position: "absolute",
                      left: `${start * 100}%` as unknown as number,
                      width:
                        `${Math.min(width * 100, 100 - start * 100)}%` as unknown as number,
                      height: 6,
                      backgroundColor: color,
                      borderRadius: 3,
                    }}
                  />
                );
              })}
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  color: colors.muted,
                }}
              >
                {formatTimestamp(traceEvents[0]?.timestamp ?? "")}
              </Text>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  color: colors.muted,
                }}
              >
                {formatTimestamp(
                  traceEvents[traceEvents.length - 1]?.timestamp ?? "",
                )}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 16 }}>
            {[
              { label: "Events", value: String(traceEvents.length) },
              { label: "Success", value: String(successCount) },
              { label: "Failures", value: String(failCount) },
              {
                label: "Total latency",
                value:
                  totalLatency >= 1000
                    ? `${(totalLatency / 1000).toFixed(1)}s`
                    : `${totalLatency}ms`,
              },
            ].map((stat) => (
              <View key={stat.label} style={{ gap: 2 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.foreground,
                  }}
                >
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 9, color: colors.muted }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={{ gap: 0 }}>
          {traceEvents.map((e, i) => {
            const offsetMs = new Date(e.timestamp).getTime() - firstTs;
            const offsetLabel =
              offsetMs === 0
                ? "+0.00s"
                : offsetMs < 1000
                  ? `+${offsetMs}ms`
                  : `+${(offsetMs / 1000).toFixed(2)}s`;
            const isLast = i === traceEvents.length - 1;
            const stageColor = colors[stageColorKey(e.stage)] as string;

            return (
              <View key={e.audit_id} style={{ flexDirection: "row", gap: 8 }}>
                {/* Offset gutter */}
                <View
                  style={{ width: 48, alignItems: "flex-end", paddingTop: 12 }}
                >
                  <Text
                    style={{
                      fontFamily: monoFont,
                      fontSize: 8,
                      color: colors.muted,
                    }}
                  >
                    {offsetLabel}
                  </Text>
                </View>

                {/* Line + dot */}
                <View style={{ alignItems: "center", width: 16 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: stageColor,
                      marginTop: 12,
                    }}
                  />
                  {!isLast && (
                    <View
                      style={{
                        width: 1,
                        flex: 1,
                        backgroundColor: colors.border,
                        marginTop: 2,
                      }}
                    />
                  )}
                </View>

                {/* Event content */}
                <View
                  style={{
                    flex: 1,
                    paddingTop: 8,
                    paddingBottom: isLast ? 0 : 12,
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <StageChip stage={e.stage} />
                    <OutcomePill outcome={e.outcome} />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.foreground,
                      lineHeight: 17,
                    }}
                  >
                    {e.summary}
                  </Text>
                  <View
                    style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}
                  >
                    {e.latency_ms !== undefined && (
                      <Text
                        style={{
                          fontFamily: monoFont,
                          fontSize: 9,
                          color: colors.muted,
                        }}
                      >
                        {e.latency_ms >= 1000
                          ? `${(e.latency_ms / 1000).toFixed(1)}s`
                          : `${e.latency_ms}ms`}
                      </Text>
                    )}
                    {e.ref_task_id && (
                      <Text
                        style={{
                          fontFamily: monoFont,
                          fontSize: 9,
                          color: colors.accentEmphasis,
                        }}
                      >
                        task:{e.ref_task_id}
                      </Text>
                    )}
                    {e.ref_approval_id && (
                      <Text
                        style={{
                          fontFamily: monoFont,
                          fontSize: 9,
                          color: colors.warningEmphasis,
                        }}
                      >
                        apr:{e.ref_approval_id}
                      </Text>
                    )}
                    {e.tool_name && (
                      <Text
                        style={{
                          fontFamily: monoFont,
                          fontSize: 9,
                          color: colors.muted,
                        }}
                      >
                        {e.tool_name}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
