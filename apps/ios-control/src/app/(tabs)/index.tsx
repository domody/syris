import { useTheme } from "@shopify/restyle";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuditLevelBadge } from "@/components/audit-level-badge";
import { AutonomyPill } from "@/components/autonomy-pill";
import { LiveActivityCard } from "@/components/live-activity";
import { Middot } from "@/components/mid-dot";
import { Sparkline } from "@/components/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusDot } from "@/components/ui/status-dot";
import { TraceId } from "@/components/ui/trace-id";
import { AUDIT_ROWS, SPARKLINE_DATA, SUBSYSTEMS } from "@/data/mock";
import { useSystemStore } from "@/stores/use-system-store";
import { monoFont, type Theme } from "@/theme";
import type { AuditLevel } from "@/types/common";

export default function OverviewScreen() {
  const { autonomyLevel, systemHealth } = useSystemStore();
  const { colors, spacing, borderRadii } = useTheme<Theme>();

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
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing[16],
          paddingTop: spacing[96],
          paddingBottom: spacing[32],
          gap: spacing[16],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: spacing[12],
            paddingBottom: spacing[16],
            display: "none",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "600",
                letterSpacing: -0.6,
                color: colors.foreground,
              }}
            >
              Overview
            </Text>
          </View>
          <AutonomyPill level={autonomyLevel} />
        </View>

        {/* ── System Health Hero ── */}
        <Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[8],
                  marginBottom: spacing[6],
                }}
              >
                <StatusDot variant={healthDotVariant} />
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: monoFont,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: colors.muted,
                  }}
                >
                  Entity online
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "600",
                  letterSpacing: -0.6,
                  color: colors.foreground,
                }}
              >
                {healthLabel}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.muted,
                  marginTop: spacing[4],
                  fontFamily: monoFont,
                }}
              >
                14d 03:22:07 <Middot /> 7 subsystems reachable
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing[14] }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing[4],
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: monoFont,
                  color: colors.muted,
                  letterSpacing: 0.5,
                }}
              >
                PIPELINE <Middot /> 24H
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: monoFont,
                  color: colors.muted,
                }}
              >
                1,284 events <Middot /> 3 errors
              </Text>
            </View>
            <Sparkline data={SPARKLINE_DATA} />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: spacing[4],
              }}
            >
              {["00:00", "06:00", "12:00", "18:00", "NOW"].map((label) => (
                <Text
                  key={label}
                  style={{
                    fontSize: 9,
                    fontFamily: monoFont,
                    color: colors.muted,
                  }}
                >
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
            <Text
              style={{
                fontSize: 12,
                fontFamily: monoFont,
                color: colors.muted,
              }}
            >
              1 running
            </Text>
          }
        />

        <LiveActivityCard>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing[8],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[8],
              }}
            >
              <SymbolView
                name={{
                  ios: "arrow.triangle.2.circlepath",
                  android: "autorenew",
                  web: "autorenew",
                }}
                size={14}
                tintColor={colors.accent}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: monoFont,
                  letterSpacing: 0.5,
                  color: colors.muted,
                }}
              >
                Agent <Middot /> morning_brief
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: monoFont,
                color: colors.muted,
                fontVariant: ["tabular-nums"],
              }}
            >
              00:47
            </Text>
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              letterSpacing: -0.3,
              color: colors.foreground,
              marginBottom: spacing[8],
            }}
          >
            Drafting daily brief <Middot /> step 3 of 5
          </Text>
          <View
            style={{
              height: 4,
              backgroundColor: colors.border,
              borderRadius: borderRadii.full,
              overflow: "hidden",
              marginBottom: spacing[10],
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: colors.info,
                borderRadius: borderRadii.full,
                width: "60%",
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[6],
            }}
          >
            <Badge label="LLM" variant="info" />
            <Text
              style={{
                fontSize: 10,
                fontFamily: monoFont,
                color: colors.muted,
              }}
            >
              synthesizing calendar + mail triage
            </Text>
          </View>
        </LiveActivityCard>

        {/* ── Needs Attention ── */}
        <SectionHeader
          title="Needs attention"
          trailing={<Badge label="2 pending" variant="warning" />}
        />

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadii.xl,
            overflow: "hidden",
          }}
        >
          {/* Approval row */}
          <Pressable
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[12],
              paddingHorizontal: spacing[16],
              paddingVertical: spacing[12],
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: borderRadii.xl,
                backgroundColor: colors.warningSubtle20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.foreground,
                }}
              >
                Unlock front door <Middot /> Dad
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[6],
                  marginTop: spacing[2],
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: monoFont,
                    color: colors.muted,
                  }}
                >
                  apr_01JH7A4K
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  <Middot />
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  approval required
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  <Middot />
                </Text>
                <Badge label="medium" variant="warning" />
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted }}>2m</Text>
          </Pressable>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginHorizontal: spacing[16],
            }}
          />

          {/* Escalation row */}
          <Pressable
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[12],
              paddingHorizontal: spacing[16],
              paddingVertical: spacing[12],
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: borderRadii.xl,
                backgroundColor: colors.accentSubtle,
                alignItems: "center",
                justifyContent: "center",
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
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.foreground,
                }}
              >
                Intent unclear <Middot /> garage SMS
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[6],
                  marginTop: spacing[2],
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: monoFont,
                    color: colors.muted,
                  }}
                >
                  esc_01JH7A9P
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  <Middot />
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  select interpretation
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted }}>6m</Text>
          </Pressable>
        </View>

        {/* ── Recent Activity ── */}
        <SectionHeader
          title="Recent activity"
          trailing={
            <Text
              style={{
                fontSize: 12,
                fontFamily: monoFont,
                color: colors.accentMid,
              }}
            >
              Tail →
            </Text>
          }
        />

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadii.xl,
            paddingHorizontal: spacing[12],
            paddingVertical: spacing[4],
          }}
        >
          {AUDIT_ROWS.map(([time, level, type, traceId], i) => (
            <View
              key={i}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[8],
                  paddingVertical: spacing[8],
                },
                i < AUDIT_ROWS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: monoFont,
                  color: colors.muted,
                  width: 56,
                }}
              >
                {time}
              </Text>
              <AuditLevelBadge level={level as AuditLevel} />
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[4],
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: monoFont,
                    color: colors.foreground,
                    flexShrink: 1,
                  }}
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

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadii.xl,
            overflow: "hidden",
          }}
        >
          {SUBSYSTEMS.map((sys, i) => (
            <View key={i}>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[12],
                  paddingHorizontal: spacing[16],
                  paddingVertical: spacing[12],
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: borderRadii.xl,
                    backgroundColor: colors.elementBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolView
                    name={{
                      ios: sys.iconIos,
                      android: sys.iconAndroid,
                      web: sys.iconAndroid,
                    }}
                    size={15}
                    tintColor={colors.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.foreground,
                    }}
                  >
                    {sys.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[6],
                      marginTop: spacing[2],
                    }}
                  >
                    <StatusDot
                      variant={
                        sys.status === "degraded" ? "warning" : "success"
                      }
                    />
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {sys.status}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      <Middot />
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: monoFont,
                        color: colors.muted,
                      }}
                    >
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
                  tintColor={colors.muted}
                />
              </Pressable>
              {i < SUBSYSTEMS.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginHorizontal: spacing[16],
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
