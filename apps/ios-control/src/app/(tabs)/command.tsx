import { useTheme } from "@shopify/restyle";
import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { TraceId } from "@/components/ui/trace-id";
import { useSystemStore } from "@/stores/use-system-store";
import { monoFont, type Theme } from "@/theme";

// ─── Types ───────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high" | "critical";

type BaseResponse = { traceId: string; timestamp: string };

type TaskCreatedResponse = BaseResponse & {
  kind: "task_created";
  taskId: string;
  summary: string;
  steps: number;
};

type ApprovalSurfacedResponse = BaseResponse & {
  kind: "approval_surfaced";
  approvalId: string;
  why: string;
  what: string;
  riskLevel: RiskLevel;
  expiresIn: string;
};

type DryRunResponse = BaseResponse & {
  kind: "dry_run";
  preview: string[];
  note: string;
};

type InformationalResponse = BaseResponse & {
  kind: "informational";
  answer: string;
};

type GeneralChatResponse = BaseResponse & {
  kind: "general_chat";
  text: string;
};

type SyrisResponse =
  | TaskCreatedResponse
  | ApprovalSurfacedResponse
  | DryRunResponse
  | InformationalResponse
  | GeneralChatResponse;

type Exchange = {
  id: string;
  timestamp: string;
  autonomy: string;
  command: string;
  response: SyrisResponse | null;
};

// ─── Mock data ───────────────────────────────────────────────────────────────

const INITIAL_EXCHANGES: Exchange[] = [
  {
    id: "ex1",
    timestamp: "09:14:22",
    autonomy: "A3",
    command: "run morning_brief with calendar focus",
    response: {
      kind: "task_created",
      traceId: "01JH7A4K6N",
      timestamp: "09:14:23",
      taskId: "tsk_01JH7B2QX",
      summary:
        "morning_brief agent queued — calendar + mail triage, daily digest generation",
      steps: 5,
    },
  },
  {
    id: "ex2",
    timestamp: "09:21:05",
    autonomy: "A3",
    command: "unlock front door for Dad",
    response: {
      kind: "approval_surfaced",
      traceId: "01JH7A9P3M",
      timestamp: "09:21:06",
      approvalId: "apr_01JH7A4K",
      why: "HomeKit device action exceeds A3 scope — home-device unlock requires explicit approval",
      what: 'POST /connectors/homekit {"device":"front_door","action":"unlock"}',
      riskLevel: "medium",
      expiresIn: "3:47",
    },
  },
  {
    id: "ex3",
    timestamp: "09:33:11",
    autonomy: "A0",
    command: "dim kitchen lights to 40% and play jazz",
    response: {
      kind: "dry_run",
      traceId: "01JH7B1XZ2",
      timestamp: "09:33:12",
      preview: [
        "HomeKit · kitchen ceiling → 40% brightness",
        "HomeKit · kitchen spots → 40% brightness",
        "Music · AirPlay kitchen → Jazz Radio (Apple Music)",
      ],
      note: "Autonomy A0 active — suggest-only mode, no actions will execute",
    },
  },
  {
    id: "ex4",
    timestamp: "09:41:58",
    autonomy: "A3",
    command: "how many events came through the pipeline today?",
    response: {
      kind: "informational",
      traceId: "01JH7B3KQW",
      timestamp: "09:41:59",
      answer:
        "1,284 events processed (09:00–09:41 UTC). 3 errors, 2 suppressed. Pipeline p95 latency is 340ms — within normal range.",
    },
  },
  {
    id: "ex5",
    timestamp: "09:47:30",
    autonomy: "A3",
    command: "what does A2 autonomy mean exactly?",
    response: {
      kind: "general_chat",
      traceId: "01JH7B5RPX",
      timestamp: "09:47:31",
      text: "A2 auto-executes low-risk actions without approval. Medium and high-risk actions are still gated. Risk level is classified at route time using tool definitions and connector scope rules.",
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_BADGE: Record<RiskLevel, BadgeVariant> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

function nowTimestamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

// ─── Lane ────────────────────────────────────────────────────────────────────

type Lane = "fast" | "task" | "gated" | "llm";

function laneForKind(kind: SyrisResponse["kind"]): Lane {
  if (kind === "task_created") return "task";
  if (kind === "approval_surfaced") return "gated";
  if (kind === "dry_run") return "fast";
  return "llm";
}

// ─── Lane chip ────────────────────────────────────────────────────────────────

function LaneChip({ lane }: { lane: Lane }) {
  const { colors } = useTheme<Theme>();

  if (lane === "fast") {
    return (
      <View
        style={{
          height: 16,
          paddingHorizontal: 6,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.successSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            fontFamily: monoFont,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.successEmphasis,
          }}
        >
          Fast path
        </Text>
      </View>
    );
  }
  if (lane === "task") {
    return (
      <View
        style={{
          height: 16,
          paddingHorizontal: 6,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            fontFamily: monoFont,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.accentEmphasis,
          }}
        >
          Task created
        </Text>
      </View>
    );
  }
  if (lane === "gated") {
    return (
      <View
        style={{
          height: 16,
          paddingHorizontal: 6,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.warningSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            fontFamily: monoFont,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.warningEmphasis,
          }}
        >
          Gated · approval
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        height: 16,
        paddingHorizontal: 6,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.elementBgSubtle,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "600",
          fontFamily: monoFont,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: colors.llmLaneText,
        }}
      >
        LLM lane
      </Text>
    </View>
  );
}

// ─── Thinking bubble ──────────────────────────────────────────────────────────

function ThinkingBubble() {
  const { colors } = useTheme<Theme>();
  const o1 = useSharedValue(0.4);
  const o2 = useSharedValue(0.4);
  const o3 = useSharedValue(0.4);

  useEffect(() => {
    const pulse = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.4, {
              duration: 480,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0.4, { duration: 240 }),
          ),
          -1,
          false,
        ),
      );
    o1.value = pulse(0);
    o2.value = pulse(150);
    o3.value = pulse(300);
  }, [o1, o2, o3]);

  const s1 = useAnimatedStyle(() => ({ opacity: o1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: o2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: o3.value }));

  const dotStyle = {
    width: 5,
    height: 5,
    borderRadius: 9999,
    backgroundColor: colors.muted,
  };

  return (
    <View style={{ alignItems: "flex-start", gap: 4 }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Animated.View style={[dotStyle, s1]} />
        <Animated.View style={[dotStyle, s2]} />
        <Animated.View style={[dotStyle, s3]} />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontFamily: monoFont,
          color: colors.muted,
          paddingHorizontal: 4,
        }}
      >
        routing · rules → LLM fallback
      </Text>
    </View>
  );
}

// ─── Sys bubble content ───────────────────────────────────────────────────────

function UnderstoodRow({ label }: { label: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Understood
      </Text>
      <Text style={{ fontSize: 12.5, color: colors.foreground }}>{label}</Text>
    </View>
  );
}

function TaskCreatedContent({ r }: { r: TaskCreatedResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <>
      <UnderstoodRow label={`Task · ${r.steps} steps`} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 6,
          gap: 6,
        }}
      >
        <Text
          style={{ fontSize: 12, color: colors.foreground, lineHeight: 17 }}
        >
          {r.summary}
        </Text>
        <Text
          style={{ fontSize: 10, fontFamily: monoFont, color: colors.muted }}
        >
          {r.taskId}
        </Text>
      </View>
    </>
  );
}

function ApprovalContent({ r }: { r: ApprovalSurfacedResponse }) {
  const { colors } = useTheme<Theme>();
  const [decision, setDecision] = useState<"approved" | "denied" | null>(null);

  return (
    <>
      <View
        style={{
          padding: 10,
          borderRadius: 8,
          backgroundColor: colors.warningSubtle10,
          gap: 8,
          borderWidth: 1,
          borderColor: "rgba(234,179,8,0.25)", // yellow-500/25 one-off border
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.warningEmphasis,
            }}
          >
            Approval required
          </Text>
          <Text
            style={{ fontSize: 10, fontFamily: monoFont, color: colors.muted }}
          >
            {r.approvalId}
          </Text>
          <Badge label={r.riskLevel} variant={RISK_BADGE[r.riskLevel]} />
          <Text
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              color: colors.warningMid,
            }}
          >
            exp {r.expiresIn}
          </Text>
        </View>
        <Text
          style={{ fontSize: 12, color: colors.foreground, lineHeight: 17 }}
        >
          {r.why}
        </Text>
        <View
          style={{
            backgroundColor: colors.codeBg,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
            numberOfLines={2}
          >
            {r.what}
          </Text>
        </View>
      </View>
      {decision === null ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setDecision("approved")}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: colors.successSubtle,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.successEmphasis,
              }}
            >
              Approve
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDecision("denied")}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: colors.errorSubtle10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.errorEmphasis,
              }}
            >
              Deny
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor:
              decision === "approved"
                ? colors.successSubtle10
                : colors.errorSubtle10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color:
                decision === "approved"
                  ? colors.successEmphasis
                  : colors.errorEmphasis,
            }}
          >
            {decision === "approved" ? "Approved" : "Denied"}
          </Text>
          <Text
            style={{ fontSize: 10, fontFamily: monoFont, color: colors.muted }}
          >
            {nowTimestamp()}
          </Text>
        </View>
      )}
    </>
  );
}

function DryRunContent({ r }: { r: DryRunResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <>
      <UnderstoodRow label={r.note} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 6,
          gap: 4,
        }}
      >
        {r.preview.map((line, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: monoFont,
                color: colors.successMid,
                marginTop: 1,
              }}
            >
              →
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: monoFont,
                color: colors.foreground,
                flex: 1,
                lineHeight: 17,
              }}
            >
              {line}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function InformationalContent({ r }: { r: InformationalResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <Text style={{ fontSize: 12.5, color: colors.foreground, lineHeight: 20 }}>
      {r.answer}
    </Text>
  );
}

function GeneralChatContent({ r }: { r: GeneralChatResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <Text style={{ fontSize: 12.5, color: colors.foreground, lineHeight: 20 }}>
      {r.text}
    </Text>
  );
}

// ─── Chat bubbles ─────────────────────────────────────────────────────────────

function ChatBubbleUser({ command }: { command: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        alignSelf: "flex-end",
        maxWidth: "82%",
        backgroundColor: colors.accent,
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.white, lineHeight: 19 }}>
        {command}
      </Text>
    </View>
  );
}

function ChatBubbleSys({ response }: { response: SyrisResponse }) {
  const { colors } = useTheme<Theme>();
  const lane = laneForKind(response.kind);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        maxWidth: "92%",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 16,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <LaneChip lane={lane} />
        <TraceId value={response.traceId} />
      </View>
      {response.kind === "task_created" && <TaskCreatedContent r={response} />}
      {response.kind === "approval_surfaced" && (
        <ApprovalContent r={response} />
      )}
      {response.kind === "dry_run" && <DryRunContent r={response} />}
      {response.kind === "informational" && (
        <InformationalContent r={response} />
      )}
      {response.kind === "general_chat" && <GeneralChatContent r={response} />}
    </View>
  );
}

// ─── Exchange entry ───────────────────────────────────────────────────────────

function ExchangeEntry({ item }: { item: Exchange }) {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <ChatBubbleUser command={item.command} />
        <Text
          style={{
            fontSize: 10,
            fontFamily: monoFont,
            color: colors.muted,
            paddingHorizontal: 4,
          }}
        >
          {item.timestamp}
        </Text>
      </View>
      {item.response === null ? (
        <ThinkingBubble />
      ) : (
        <View style={{ alignItems: "flex-start", gap: 2 }}>
          <ChatBubbleSys response={item.response} />
          <Text
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              color: colors.muted,
              paddingHorizontal: 4,
            }}
          >
            {item.response.timestamp}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Floating input bar ───────────────────────────────────────────────────────

function FloatingInputBar({ onSend }: { onSend: (text: string) => void }) {
  const { colors, borderRadii } = useTheme<Theme>();
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <GlassView
      style={{
        marginHorizontal: 12,
        marginBottom: 20,
        borderRadius: borderRadii.full,
        // backgroundColor: colors.card,
        borderWidth: 1,
        // borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingRight: 10,
        paddingLeft: 14,
        gap: 10,
        // position: "absolute",
        // top: 4,
        // left: 8,
      }}
    >
      <SymbolView
        name={{ ios: "terminal", android: "code", web: "code" }}
        size={16}
        tintColor={colors.muted}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Tell SYRIS what to do…"
        placeholderTextColor={colors.muted}
        style={{ flex: 1, fontSize: 14, color: colors.foreground, height: 40 }}
        returnKeyType="send"
        blurOnSubmit
        onSubmitEditing={handleSend}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: borderRadii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: canSend ? colors.accent : colors.elementBg,
          opacity: canSend && pressed ? 0.7 : 1,
        })}
      >
        <SymbolView
          name={{
            ios: "arrow.up",
            android: "arrow_upward",
            web: "arrow_upward",
          }}
          size={16}
          tintColor={canSend ? colors.white : colors.muted}
        />
      </Pressable>
    </GlassView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const DEMO_RESPONSES: SyrisResponse[] = [
  {
    kind: "informational",
    traceId: "01DEMO0001",
    timestamp: "",
    answer:
      "No matching rule or connector found. Try rephrasing or check available connectors via the audit log.",
  },
  {
    kind: "task_created",
    traceId: "01DEMO0002",
    timestamp: "",
    taskId: "tsk_demo_01",
    summary:
      "Command queued as a one-off task. SYRIS will execute when resources are available.",
    steps: 2,
  },
];

let demoIdx = 0;

export default function CommandScreen() {
  const { autonomyLevel } = useSystemStore();
  const { colors, borderRadii } = useTheme<Theme>();
  const autonomy = autonomyLevel ?? "A3";

  const [exchanges, setExchanges] = useState<Exchange[]>(INITIAL_EXCHANGES);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const id = setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: false }),
      80,
    );
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [exchanges.length]);

  const handleSend = (command: string) => {
    const id = `ex-${Date.now()}`;
    const now = nowTimestamp();

    setExchanges((prev) => [
      ...prev,
      { id, timestamp: now, autonomy, command, response: null },
    ]);

    setTimeout(
      () => {
        const template = DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length]!;
        demoIdx += 1;
        setExchanges((prev) =>
          prev.map((ex) =>
            ex.id === id
              ? { ...ex, response: { ...template, timestamp: nowTimestamp() } }
              : ex,
          ),
        );
      },
      2100 + Math.random() * 600,
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, position: "relative" }}>
          {/* <ScrollView
          ref={flatListRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 32,
            gap: 10,
            // position: "relative",
            backgroundColor: "#ff0000",
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          >
          {exchanges.map((ex) => (
            <ExchangeEntry key={ex.id} exchange={ex} />
          ))} */}
          <FlatList
            ref={flatListRef}
            data={exchanges}
            keyExtractor={(exhange) => exhange.id}
            contentContainerStyle={{
              gap: 10,
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 256,
            }}
            renderItem={({ item }) => <ExchangeEntry item={item} />}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <FloatingInputBar onSend={handleSend} />
          </View>
          {/* </ScrollView> */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// <View
//   style={{
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderRadius: borderRadii.xl,
//     backgroundColor: colors.codeBg,
//     borderWidth: 1,
//     borderColor: colors.border,
//   }}
// >
//   <Text
//     style={{
//       fontSize: 11,
//       fontFamily: monoFont,
//       textAlign: "center",
//       color: colors.muted,
//     }}
//   >
//     <Text style={{ color: colors.foreground }}>
//       Command interface
//     </Text>
//     {
//       " · not a chatbot. Messages are ingested as events through the normal pipeline."
//     }
//   </Text>
// </View>
