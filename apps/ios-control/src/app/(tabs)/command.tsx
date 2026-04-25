import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { TraceId } from '@/components/ui/trace-id';
import { Colors } from '@/constants/theme';
import { useSystemStore } from '@/stores/use-system-store';

// ─── Types ───────────────────────────────────────────────────────────────────

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type BaseResponse = {
  traceId: string;
  timestamp: string;
};

type TaskCreatedResponse = BaseResponse & {
  kind: 'task_created';
  taskId: string;
  summary: string;
  steps: number;
};

type ApprovalSurfacedResponse = BaseResponse & {
  kind: 'approval_surfaced';
  approvalId: string;
  why: string;
  what: string;
  riskLevel: RiskLevel;
  expiresIn: string;
};

type DryRunResponse = BaseResponse & {
  kind: 'dry_run';
  preview: string[];
  note: string;
};

type InformationalResponse = BaseResponse & {
  kind: 'informational';
  answer: string;
};

type GeneralChatResponse = BaseResponse & {
  kind: 'general_chat';
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
    id: 'ex1',
    timestamp: '09:14:22',
    autonomy: 'A3',
    command: 'run morning_brief with calendar focus',
    response: {
      kind: 'task_created',
      traceId: '01JH7A4K6N',
      timestamp: '09:14:23',
      taskId: 'tsk_01JH7B2QX',
      summary: 'morning_brief agent queued — calendar + mail triage, daily digest generation',
      steps: 5,
    },
  },
  {
    id: 'ex2',
    timestamp: '09:21:05',
    autonomy: 'A3',
    command: 'unlock front door for Dad',
    response: {
      kind: 'approval_surfaced',
      traceId: '01JH7A9P3M',
      timestamp: '09:21:06',
      approvalId: 'apr_01JH7A4K',
      why: 'HomeKit device action exceeds A3 scope — home-device unlock requires explicit approval',
      what: 'POST /connectors/homekit {"device":"front_door","action":"unlock"}',
      riskLevel: 'medium',
      expiresIn: '3:47',
    },
  },
  {
    id: 'ex3',
    timestamp: '09:33:11',
    autonomy: 'A0',
    command: 'dim kitchen lights to 40% and play jazz',
    response: {
      kind: 'dry_run',
      traceId: '01JH7B1XZ2',
      timestamp: '09:33:12',
      preview: [
        'HomeKit · kitchen ceiling → 40% brightness',
        'HomeKit · kitchen spots → 40% brightness',
        'Music · AirPlay kitchen → Jazz Radio (Apple Music)',
      ],
      note: 'Autonomy A0 active — suggest-only mode, no actions will execute',
    },
  },
  {
    id: 'ex4',
    timestamp: '09:41:58',
    autonomy: 'A3',
    command: 'how many events came through the pipeline today?',
    response: {
      kind: 'informational',
      traceId: '01JH7B3KQW',
      timestamp: '09:41:59',
      answer:
        '1,284 events processed (09:00–09:41 UTC). 3 errors, 2 suppressed. Pipeline p95 latency is 340ms — within normal range.',
    },
  },
  {
    id: 'ex5',
    timestamp: '09:47:30',
    autonomy: 'A3',
    command: 'what does A2 autonomy mean exactly?',
    response: {
      kind: 'general_chat',
      traceId: '01JH7B5RPX',
      timestamp: '09:47:31',
      text: 'A2 auto-executes low-risk actions without approval. Medium and high-risk actions are still gated. Risk level is classified at route time using tool definitions and connector scope rules.',
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_BADGE: Record<RiskLevel, BadgeVariant> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

function nowTimestamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

// ─── Lane ────────────────────────────────────────────────────────────────────

type Lane = 'fast' | 'task' | 'gated' | 'llm';

function laneForKind(kind: SyrisResponse['kind']): Lane {
  if (kind === 'task_created') return 'task';
  if (kind === 'approval_surfaced') return 'gated';
  if (kind === 'dry_run') return 'fast';
  return 'llm';
}

// ─── Lane chip ────────────────────────────────────────────────────────────────

function LaneChip({ lane }: { lane: Lane }) {
  if (lane === 'fast') {
    return (
      <View className="h-4 px-1.5 rounded-[4px] items-center justify-center bg-green-500/15 dark:bg-green-400/15">
        <Text className="text-[9px] font-semibold font-mono tracking-widest uppercase text-green-700 dark:text-green-400">
          Fast path
        </Text>
      </View>
    );
  }
  if (lane === 'task') {
    return (
      <View className="h-4 px-1.5 rounded-[4px] items-center justify-center bg-blue-500/15 dark:bg-blue-400/15">
        <Text className="text-[9px] font-semibold font-mono tracking-widest uppercase text-blue-700 dark:text-blue-400">
          Task created
        </Text>
      </View>
    );
  }
  if (lane === 'gated') {
    return (
      <View className="h-4 px-1.5 rounded-[4px] items-center justify-center bg-yellow-500/15 dark:bg-yellow-400/15">
        <Text className="text-[9px] font-semibold font-mono tracking-widest uppercase text-yellow-700 dark:text-yellow-400">
          Gated · approval
        </Text>
      </View>
    );
  }
  return (
    <View className="h-4 px-1.5 rounded-[4px] items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-border">
      <Text className="text-[9px] font-semibold font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-300">
        LLM lane
      </Text>
    </View>
  );
}

// ─── Thinking bubble ──────────────────────────────────────────────────────────

function ThinkingBubble() {
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
            withTiming(0.4, { duration: 480, easing: Easing.inOut(Easing.ease) }),
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

  return (
    <View className="items-start gap-1">
      <View className="bg-card border border-border rounded-tl-2xl rounded-tr-2xl rounded-bl-[4px] rounded-br-2xl px-3 py-2 flex-row items-center gap-[5px]">
        <Animated.View style={s1} className="w-[5px] h-[5px] rounded-full bg-muted" />
        <Animated.View style={s2} className="w-[5px] h-[5px] rounded-full bg-muted" />
        <Animated.View style={s3} className="w-[5px] h-[5px] rounded-full bg-muted" />
      </View>
      <Text className="text-[10px] font-mono text-muted px-1">routing · rules → LLM fallback</Text>
    </View>
  );
}

// ─── Sys bubble content ───────────────────────────────────────────────────────

function UnderstoodRow({ label }: { label: string }) {
  return (
    <View className="gap-1">
      <Text className="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted">
        Understood
      </Text>
      <Text className="text-[12.5px] text-foreground">{label}</Text>
    </View>
  );
}

function TaskCreatedContent({ r }: { r: TaskCreatedResponse }) {
  return (
    <>
      <UnderstoodRow label={`Task · ${r.steps} steps`} />
      <View className="border-t border-border pt-1.5 gap-1.5">
        <Text className="text-[12px] text-foreground leading-snug">{r.summary}</Text>
        <Text className="text-[10px] font-mono text-muted">{r.taskId}</Text>
      </View>
    </>
  );
}

function ApprovalContent({ r }: { r: ApprovalSurfacedResponse }) {
  const [decision, setDecision] = useState<'approved' | 'denied' | null>(null);

  return (
    <>
      <View
        className="p-2.5 rounded-lg bg-yellow-500/10 dark:bg-yellow-400/10 gap-2"
        style={{ borderWidth: 1, borderColor: 'rgba(234,179,8,0.25)' }}
      >
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-[12px] font-semibold text-yellow-700 dark:text-yellow-400">
            Approval required
          </Text>
          <Text className="text-[10px] font-mono text-muted">{r.approvalId}</Text>
          <Badge label={r.riskLevel} variant={RISK_BADGE[r.riskLevel]} />
          <Text className="text-[10px] font-mono text-yellow-600 dark:text-yellow-400">
            exp {r.expiresIn}
          </Text>
        </View>
        <Text className="text-[12px] text-foreground leading-snug">{r.why}</Text>
        <View className="bg-zinc-100 dark:bg-zinc-900 rounded-lg px-3 py-2">
          <Text className="font-mono text-[10px] text-muted" numberOfLines={2}>
            {r.what}
          </Text>
        </View>
      </View>
      {decision === null ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setDecision('approved')}
            className="flex-1 items-center py-2.5 rounded-xl bg-green-500/15 dark:bg-green-400/15 active:opacity-70"
          >
            <Text className="text-[12px] font-semibold text-green-700 dark:text-green-400">
              Approve
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDecision('denied')}
            className="flex-1 items-center py-2.5 rounded-xl bg-red-500/10 dark:bg-red-400/10 active:opacity-70"
          >
            <Text className="text-[12px] font-semibold text-red-700 dark:text-red-400">Deny</Text>
          </Pressable>
        </View>
      ) : (
        <View
          className={`flex-row items-center gap-2 py-2.5 px-3 rounded-xl ${
            decision === 'approved'
              ? 'bg-green-500/10 dark:bg-green-400/10'
              : 'bg-red-500/10 dark:bg-red-400/10'
          }`}
        >
          <Text
            className={`text-[12px] font-semibold ${
              decision === 'approved'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {decision === 'approved' ? 'Approved' : 'Denied'}
          </Text>
          <Text className="text-[10px] font-mono text-muted">{nowTimestamp()}</Text>
        </View>
      )}
    </>
  );
}

function DryRunContent({ r }: { r: DryRunResponse }) {
  return (
    <>
      <UnderstoodRow label={r.note} />
      <View className="border-t border-border pt-1.5 gap-1">
        {r.preview.map((line, i) => (
          <View key={i} className="flex-row items-start gap-2">
            <Text className="text-[11px] font-mono text-green-600 dark:text-green-400 mt-px">→</Text>
            <Text className="text-[12px] font-mono text-foreground flex-1 leading-snug">{line}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function InformationalContent({ r }: { r: InformationalResponse }) {
  return (
    <Text className="text-[12.5px] text-foreground leading-relaxed">{r.answer}</Text>
  );
}

function GeneralChatContent({ r }: { r: GeneralChatResponse }) {
  return (
    <Text className="text-[12.5px] text-foreground leading-relaxed">{r.text}</Text>
  );
}

// ─── Chat bubbles ─────────────────────────────────────────────────────────────

function ChatBubbleUser({ command }: { command: string }) {
  return (
    <View className="self-end max-w-[82%] bg-accent px-[13px] py-[9px] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4px]">
      <Text className="text-[13px] text-white leading-[1.45]">{command}</Text>
    </View>
  );
}

function ChatBubbleSys({ response }: { response: SyrisResponse }) {
  const lane = laneForKind(response.kind);
  return (
    <View className="self-start max-w-[92%] bg-card border border-border px-3 py-2.5 rounded-tl-2xl rounded-tr-2xl rounded-bl-[4px] rounded-br-2xl gap-2">
      <View className="flex-row items-center gap-1.5">
        <LaneChip lane={lane} />
        <TraceId value={response.traceId} />
      </View>
      {response.kind === 'task_created' && <TaskCreatedContent r={response} />}
      {response.kind === 'approval_surfaced' && <ApprovalContent r={response} />}
      {response.kind === 'dry_run' && <DryRunContent r={response} />}
      {response.kind === 'informational' && <InformationalContent r={response} />}
      {response.kind === 'general_chat' && <GeneralChatContent r={response} />}
    </View>
  );
}

// ─── Exchange entry ───────────────────────────────────────────────────────────

function ExchangeEntry({ exchange }: { exchange: Exchange }) {
  return (
    <View className="gap-1.5">
      <View className="items-end gap-0.5">
        <ChatBubbleUser command={exchange.command} />
        <Text className="text-[10px] font-mono text-muted px-1">{exchange.timestamp}</Text>
      </View>
      {exchange.response === null ? (
        <ThinkingBubble />
      ) : (
        <View className="items-start gap-0.5">
          <ChatBubbleSys response={exchange.response} />
          <Text className="text-[10px] font-mono text-muted px-1">
            {exchange.response.timestamp}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Floating input bar ───────────────────────────────────────────────────────

function FloatingInputBar({
  onSend,
  placeholderColor,
}: {
  onSend: (text: string) => void;
  placeholderColor: string;
}) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View className="mx-3 mb-5 rounded-[22px] bg-card border border-border flex-row items-center py-[10px] pr-[10px] pl-[14px] gap-[10px]">
      <SymbolView
        name={{ ios: 'terminal', android: 'code', web: 'code' }}
        size={16}
        tintColor={colors.textSecondary}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Tell SYRIS what to do…"
        placeholderTextColor={placeholderColor}
        className="flex-1 text-[14px] text-foreground"
        style={{ height: 40 }}
        returnKeyType="send"
        blurOnSubmit
        onSubmitEditing={handleSend}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          canSend ? 'bg-accent active:opacity-70' : 'bg-zinc-200 dark:bg-zinc-800'
        }`}
      >
        <SymbolView
          name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
          size={16}
          tintColor={canSend ? '#ffffff' : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const DEMO_RESPONSES: SyrisResponse[] = [
  {
    kind: 'informational',
    traceId: '01DEMO0001',
    timestamp: '',
    answer:
      'No matching rule or connector found. Try rephrasing or check available connectors via the audit log.',
  },
  {
    kind: 'task_created',
    traceId: '01DEMO0002',
    timestamp: '',
    taskId: 'tsk_demo_01',
    summary: 'Command queued as a one-off task. SYRIS will execute when resources are available.',
    steps: 2,
  },
];

let demoIdx = 0;

export default function CommandScreen() {
  const { autonomyLevel } = useSystemStore();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const autonomy = autonomyLevel ?? 'A3';

  const [exchanges, setExchanges] = useState<Exchange[]>(INITIAL_EXCHANGES);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [exchanges.length]);

  const handleSend = (command: string) => {
    const id = `ex-${Date.now()}`;
    const now = nowTimestamp();

    setExchanges((prev) => [
      ...prev,
      { id, timestamp: now, autonomy, command, response: null },
    ]);

    setTimeout(() => {
      const template = DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length]!;
      demoIdx += 1;
      setExchanges((prev) =>
        prev.map((ex) =>
          ex.id === id
            ? { ...ex, response: { ...template, timestamp: nowTimestamp() } }
            : ex,
        ),
      );
    }, 2100 + Math.random() * 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-8 gap-[10px]"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <View className="px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-border">
            <Text className="text-[11px] font-mono text-center text-muted">
              <Text className="text-foreground">Command interface</Text>
              {' · not a chatbot. Messages are ingested as events through the normal pipeline.'}
            </Text>
          </View>

          {exchanges.map((ex) => (
            <ExchangeEntry key={ex.id} exchange={ex} />
          ))}
        </ScrollView>

        <FloatingInputBar onSend={handleSend} placeholderColor={colors.textSecondary} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
