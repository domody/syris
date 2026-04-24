import { Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { Colors } from '@/constants/theme';
import { Badge, type BadgeVariant } from '@/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type FilterId = 'all' | 'action' | 'agent' | 'info' | 'alarm';
type CardColors = (typeof Colors)[keyof typeof Colors];

type ApprovalItem = {
  id: string; kind: 'approval'; unread: boolean; time: string;
  title: string; snippet: string;
  approvalId: string; riskLevel: RiskLevel; expiresIn: string;
};
type EscalationItem = {
  id: string; kind: 'escalation'; unread: boolean; time: string;
  title: string; snippet: string;
  escalationId: string;
};
type AgentItem = {
  id: string; kind: 'agent'; unread: boolean; time: string;
  title: string; snippet: string;
  runId: string; elapsed: string;
};
type InfoItem = {
  id: string; kind: 'info'; unread: boolean; time: string;
  title: string; snippet: string;
  eventId: string;
};
type AlarmItem = {
  id: string; kind: 'alarm'; unread: boolean; time: string;
  title: string; snippet: string;
  alarmId: string; autocleared: boolean;
};
type InboxItem = ApprovalItem | EscalationItem | AgentItem | InfoItem | AlarmItem;

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_INBOX: InboxItem[] = [
  {
    id: 'n1', kind: 'approval', unread: true, time: '2m',
    title: 'Approval needed · unlock door',
    snippet: 'Dad requested front door unlock. Action exceeds A3 home-device scope.',
    approvalId: 'apr_01JH7A4K', riskLevel: 'medium', expiresIn: '3:47',
  },
  {
    id: 'n2', kind: 'escalation', unread: true, time: '6m',
    title: 'Intent unclear · garage SMS',
    snippet: '"yo can you close up when you leave" — 3 possible interpretations.',
    escalationId: 'esc_01JH7A9P',
  },
  {
    id: 'n3', kind: 'agent', unread: true, time: 'now',
    title: 'morning_brief · step 3/5',
    snippet: 'Synthesizing calendar + mail triage. LLM involved.',
    runId: 'run_01JH7B2QX', elapsed: '00:47',
  },
  {
    id: 'n4', kind: 'info', unread: false, time: '12m',
    title: 'Motion · foyer',
    snippet: 'Detected while you were away. Matched expected pattern (cat).',
    eventId: 'evt_01JH7A1K',
  },
  {
    id: 'n5', kind: 'info', unread: false, time: '24m',
    title: 'Timer completed · oven preheat',
    snippet: 'Kitchen oven reached 425°F after 8m 14s. Announced on speakers.',
    eventId: 'tmr_01JH79ZA',
  },
  {
    id: 'n6', kind: 'alarm', unread: false, time: '1h',
    title: 'Alarm raised · water leak sensor',
    snippet: 'Basement sensor spiked. Resolved automatically after 40s.',
    alarmId: 'alm_01JH78YC', autocleared: true,
  },
  {
    id: 'n7', kind: 'info', unread: false, time: '9h',
    title: 'Scheduled rule fired',
    snippet: 'bedtime.dim ran at 22:30. 4 lights dimmed to 15%.',
    eventId: 'rule_bedtime.dim',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_VARIANT: Record<RiskLevel, BadgeVariant> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

function filterItems(items: InboxItem[], filter: FilterId): InboxItem[] {
  switch (filter) {
    case 'action': return items.filter(it => it.kind === 'approval' || it.kind === 'escalation');
    case 'agent':  return items.filter(it => it.kind === 'agent');
    case 'info':   return items.filter(it => it.kind === 'info');
    case 'alarm':  return items.filter(it => it.kind === 'alarm');
    default:       return items;
  }
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function UnreadDot() {
  return (
    <View
      className="absolute w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
      style={{ left: 6, top: 22 }}
    />
  );
}

function LiveDot() {
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
      style={animStyle}
      className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
    />
  );
}

// ─── Card variants ────────────────────────────────────────────────────────────

function ApprovalCard({ item, colors }: { item: ApprovalItem; colors: CardColors }) {
  return (
    <Pressable className="relative flex-row items-start gap-2.5 px-3.5 py-3 active:opacity-70">
      {item.unread && <UnreadDot />}
      <View className="w-9 h-9 rounded-[10px] bg-yellow-500/15 dark:bg-yellow-400/15 items-center justify-center shrink-0">
        <SymbolView
          name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
          size={16}
          tintColor={colors.warning}
        />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[13px] font-medium leading-tight text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11px] leading-snug text-muted mt-0.5" numberOfLines={2}>
          {item.snippet}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
          <Text className="font-mono text-[10px] text-muted">{item.approvalId}</Text>
          <Text className="text-[10px] text-zinc-300 dark:text-zinc-700">·</Text>
          <Badge label={item.riskLevel} variant={RISK_VARIANT[item.riskLevel]} />
          <Text className="text-[10px] text-zinc-300 dark:text-zinc-700">·</Text>
          <Text className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400">
            exp {item.expiresIn}
          </Text>
        </View>
      </View>
      <Text className="font-mono text-[10px] text-muted shrink-0 mt-0.5">{item.time}</Text>
    </Pressable>
  );
}

function EscalationCard({ item, colors }: { item: EscalationItem; colors: CardColors }) {
  return (
    <Pressable className="relative flex-row items-start gap-2.5 px-3.5 py-3 active:opacity-70">
      {item.unread && <UnreadDot />}
      <View className="w-9 h-9 rounded-[10px] bg-blue-500/15 dark:bg-blue-400/15 items-center justify-center shrink-0">
        <SymbolView
          name={{ ios: 'brain', android: 'memory', web: 'memory' }}
          size={16}
          tintColor={colors.accent}
        />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[13px] font-medium leading-tight text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11px] leading-snug text-muted mt-0.5" numberOfLines={2}>
          {item.snippet}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <Text className="font-mono text-[10px] text-muted">{item.escalationId}</Text>
          <Text className="text-[10px] text-zinc-300 dark:text-zinc-700">·</Text>
          <Text className="text-[10px] text-muted">select interpretation</Text>
        </View>
      </View>
      <Text className="font-mono text-[10px] text-muted shrink-0 mt-0.5">{item.time}</Text>
    </Pressable>
  );
}

function AgentCard({ item, colors }: { item: AgentItem; colors: CardColors }) {
  return (
    <Pressable className="relative flex-row items-start gap-2.5 px-3.5 py-3 active:opacity-70">
      {item.unread && <UnreadDot />}
      <View className="w-9 h-9 rounded-[10px] bg-blue-500/20 dark:bg-blue-400/20 items-center justify-center shrink-0">
        <SymbolView
          name={{ ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' }}
          size={16}
          tintColor={colors.accent}
        />
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-[13px] font-medium leading-tight text-foreground" numberOfLines={1}>
            {item.title}
          </Text>
          <LiveDot />
        </View>
        <Text className="text-[11px] leading-snug text-muted mt-0.5" numberOfLines={2}>
          {item.snippet}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <Text className="font-mono text-[10px] text-muted">{item.runId}</Text>
          <Text className="text-[10px] text-zinc-300 dark:text-zinc-700">·</Text>
          <Text className="font-mono text-[10px] text-muted">elapsed {item.elapsed}</Text>
        </View>
      </View>
      <Text className="font-mono text-[10px] text-muted shrink-0 mt-0.5">{item.time}</Text>
    </Pressable>
  );
}

function InfoCard({ item, colors }: { item: InfoItem; colors: CardColors }) {
  return (
    <Pressable className="relative flex-row items-start gap-2.5 px-3.5 py-3 active:opacity-70">
      {item.unread && <UnreadDot />}
      <View className="w-9 h-9 rounded-[10px] bg-zinc-100 dark:bg-zinc-800 items-center justify-center shrink-0">
        {item.eventId.startsWith('evt_') ? (
          <SymbolView name={{ ios: 'sensor.tag.radiowaves.forward', android: 'sensors', web: 'sensors' }} size={16} tintColor={colors.textSecondary} />
        ) : item.eventId.startsWith('tmr_') ? (
          <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={16} tintColor={colors.textSecondary} />
        ) : (
          <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={16} tintColor={colors.textSecondary} />
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[13px] font-medium leading-tight text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11px] leading-snug text-muted mt-0.5" numberOfLines={2}>
          {item.snippet}
        </Text>
        <View className="flex-row items-center mt-1.5">
          <Text className="font-mono text-[10px] text-muted">{item.eventId}</Text>
        </View>
      </View>
      <Text className="font-mono text-[10px] text-muted shrink-0 mt-0.5">{item.time}</Text>
    </Pressable>
  );
}

function AlarmCard({ item, colors }: { item: AlarmItem; colors: CardColors }) {
  return (
    <Pressable className="relative flex-row items-start gap-2.5 px-3.5 py-3 active:opacity-70">
      {item.unread && <UnreadDot />}
      <View className="w-9 h-9 rounded-[10px] bg-red-500/15 dark:bg-red-400/15 items-center justify-center shrink-0">
        <SymbolView
          name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
          size={16}
          tintColor={colors.error}
        />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[13px] font-medium leading-tight text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11px] leading-snug text-muted mt-0.5" numberOfLines={2}>
          {item.snippet}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <Text className="font-mono text-[10px] text-muted">{item.alarmId}</Text>
          {item.autocleared && (
            <>
              <Text className="text-[10px] text-zinc-300 dark:text-zinc-700">·</Text>
              <Badge label="auto-cleared" variant="neutral" />
            </>
          )}
        </View>
      </View>
      <Text className="font-mono text-[10px] text-muted shrink-0 mt-0.5">{item.time}</Text>
    </Pressable>
  );
}

function InboxRow({ item, colors, isLast }: { item: InboxItem; colors: CardColors; isLast: boolean }) {
  return (
    <>
      {item.kind === 'approval'   && <ApprovalCard   item={item} colors={colors} />}
      {item.kind === 'escalation' && <EscalationCard item={item} colors={colors} />}
      {item.kind === 'agent'      && <AgentCard      item={item} colors={colors} />}
      {item.kind === 'info'       && <InfoCard        item={item} colors={colors} />}
      {item.kind === 'alarm'      && <AlarmCard       item={item} colors={colors} />}
      {!isLast && <View className="h-px bg-border mx-3.5" />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const FILTER_DEFS: { id: FilterId; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'action', label: 'Needs action' },
  { id: 'agent',  label: 'Agents' },
  { id: 'info',   label: 'Info' },
  { id: 'alarm',  label: 'Alarms' },
];

export default function InboxScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [filter, setFilter] = useState<FilterId>('all');
  const [items, setItems]   = useState<InboxItem[]>(INITIAL_INBOX);

  const visible     = filterItems(items, filter);
  const unreadCount = items.filter(it => it.unread).length;
  const hasInfo     = items.some(it => it.kind === 'info');

  const countFor = (id: FilterId) => {
    switch (id) {
      case 'action': return items.filter(it => it.kind === 'approval' || it.kind === 'escalation').length;
      case 'agent':  return items.filter(it => it.kind === 'agent').length;
      case 'info':   return items.filter(it => it.kind === 'info').length;
      case 'alarm':  return items.filter(it => it.kind === 'alarm').length;
      default:       return items.length;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <Text className="text-2xl font-semibold tracking-tight text-foreground">Inbox</Text>
          {unreadCount > 0 && (
            <View className="px-2 py-0.5 rounded-full bg-blue-500/15 dark:bg-blue-400/15">
              <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row gap-1.5 px-4 pb-3"
        >
          {FILTER_DEFS.map(f => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                className={`flex-row items-center gap-1.5 rounded-lg px-3 shrink-0 active:opacity-70 ${
                  active ? 'bg-foreground' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
                style={{ height: 30 }}
              >
                <Text
                  className={`text-[12px] font-semibold ${
                    active ? 'text-white dark:text-black' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {f.label}
                </Text>
                <Text
                  className={`text-[10px] font-mono ${
                    active ? 'text-white/70 dark:text-black/70' : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {countFor(f.id)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Inbox list ── */}
        {visible.length > 0 ? (
          <View className="bg-surface rounded-xl overflow-hidden mx-4">
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
          <View className="items-center justify-center py-16 mx-4">
            <Text className="text-sm text-muted">Nothing here</Text>
          </View>
        )}

        {/* ── Clear informational ── */}
        {hasInfo && (
          <Pressable
            onPress={() => setItems(prev => prev.filter(it => it.kind !== 'info'))}
            className="self-center flex-row items-center gap-1.5 mt-4 px-4 py-2 rounded-full border border-border active:opacity-60"
          >
            <SymbolView
              name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
              size={12}
              tintColor={colors.textSecondary}
            />
            <Text className="text-xs text-muted">Clear all informational</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
