import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    cleanTitle,
    CloseButton,
    DetailCard,
    MonoBadge,
    TintedButton
} from "@/components/notif-detail-helpers";
import { Badge } from "@/components/ui/badge";
import { monoFont, type Theme } from "@/theme";
import type { AgentItem } from "@/types/ui/inbox";

const STEPS = [
  {
    title: "Read calendar · next 14h",
    key: "calendar.read",
    state: "done",
    dur: "0.3s",
  },
  {
    title: "Triage inbox · 47 → 4 signal",
    key: "mail.triage",
    state: "done",
    dur: "12.1s · LLM",
  },
  {
    title: "Draft brief · synthesize",
    key: "llm.compose",
    state: "running",
    dur: "00:34 · LLM",
  },
  {
    title: "Render to speaker & notify",
    key: "speaker.tts",
    state: "pending",
    dur: "—",
  },
  {
    title: "Finalize · log run",
    key: "run.finalize",
    state: "pending",
    dur: "—",
  },
] as const;

// StyleSheet.create required: Animated opacity cannot go through Restyle
const S = StyleSheet.create({
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
});

export function AgentDetail({ item }: { item: AgentItem }) {
  const router = useRouter();
  const { colors } = useTheme<Theme>();
  const [paused, setPaused] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (paused) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [paused, pulseAnim]);

  const traceId = "01JH7A4K6N";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <CloseButton onPress={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 48,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ gap: 8, marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: colors.accent,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              Agent flow · {paused ? "paused" : "in progress"}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: colors.foreground,
              lineHeight: 28,
            }}
          >
            {cleanTitle(item.title)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
          >
            <Badge label="LLM" variant="info" />
            <MonoBadge label={item.runId} />
            <MonoBadge label={`trace ${traceId.slice(0, 8)}`} />
          </View>
        </View>

        {/* Live activity */}
        <View
          style={{
            backgroundColor: colors.accentSubtle,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.accentSubtle20,
            padding: 14,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: colors.muted,
              }}
            >
              Step 3 of 5 · {paused ? "paused" : "running"}
            </Text>
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 12,
                color: colors.muted,
              }}
            >
              elapsed {item.elapsed}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: colors.foreground,
            }}
          >
            Synthesizing daily brief
          </Text>
          <View
            style={[
              S.progressTrack,
              { backgroundColor: colors.accentSubtle20 as string },
            ]}
          >
            {paused ? (
              <View
                style={[
                  S.progressFill,
                  { width: "60%", backgroundColor: colors.accent as string },
                ]}
              />
            ) : (
              <Animated.View
                style={[
                  S.progressFill,
                  {
                    width: "100%",
                    backgroundColor: colors.accent as string,
                    opacity: pulseAnim,
                  },
                ]}
              />
            )}
          </View>
          <Text
            style={{ fontFamily: monoFont, fontSize: 11, color: colors.muted }}
          >
            tokens: 1,244 · model: claude-haiku-4-5 · tool_calls: 7
          </Text>
        </View>

        {/* Steps plan */}
        <DetailCard>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              Plan
            </Text>
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                color: colors.muted,
              }}
            >
              5 steps · 2 done
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            {STEPS.map((step, i) => (
              <View
                key={step.key}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      step.state === "done"
                        ? colors.successSubtle
                        : step.state === "running"
                          ? colors.accentSubtle
                          : colors.elementBg,
                    flexShrink: 0,
                  }}
                >
                  {step.state === "done" ? (
                    <SymbolView
                      name={{
                        ios: "checkmark",
                        android: "check",
                        web: "check",
                      }}
                      size={10}
                      tintColor={colors.successEmphasis as string}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: monoFont,
                        fontSize: 10,
                        color:
                          step.state === "running"
                            ? (colors.accent as string)
                            : (colors.muted as string),
                      }}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color:
                        step.state === "pending"
                          ? colors.muted
                          : colors.foreground,
                    }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: monoFont,
                      fontSize: 11,
                      color: colors.muted,
                    }}
                  >
                    {step.key} · {step.dur}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </DetailCard>

        {/* Live output */}
        <DetailCard>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              Live output · step 3
            </Text>
            <Badge label="streaming" variant="info" />
          </View>
          <View
            style={{
              backgroundColor: colors.codeBg,
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: 120,
              overflow: "hidden",
            }}
          >
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 12,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              {"[compose] synthesizing...\n"}
              <Text style={{ color: colors.foreground }}>
                {'"Good morning. Three things today:"\n'}
                {'"1. Standup at 10, you\'re presenting the routing"\n'}
                {'"   changes — notes from yesterday attached."\n'}
                {'"2. Dentist reminder at 14:30 — leave by 14:05."\n'}
                {'"3. Alarm panel battery low'}
              </Text>
              <Text style={{ color: colors.muted }}>|</Text>
            </Text>
          </View>
        </DetailCard>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setPaused((p) => !p)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 13,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <SymbolView
              name={
                paused
                  ? {
                      ios: "play.fill",
                      android: "play_arrow",
                      web: "play_arrow",
                    }
                  : { ios: "pause.fill", android: "pause", web: "pause" }
              }
              size={14}
              tintColor={colors.foreground as string}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "500",
                color: colors.foreground,
              }}
            >
              {paused ? "Resume" : "Pause"}
            </Text>
          </Pressable>
          <TintedButton
            label="Cancel"
            symbolName={{ ios: "xmark", android: "close", web: "close" }}
            bg={colors.errorSubtle as string}
            textColor={colors.errorEmphasis as string}
            onPress={() => router.back()}
          />
        </View>
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          Cancel will kill agent process and log run as{" "}
          <Text style={{ color: colors.errorEmphasis as string }}>aborted</Text>
        </Text>
      </ScrollView>
    </View>
  );
}
