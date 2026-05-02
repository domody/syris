import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";

import { LiveDot } from "@/components/inbox-live-dot";
import { UnreadDot } from "@/components/inbox-unread-dot";
import { Middot } from "@/components/mid-dot";
import { monoFont } from "@/theme";
import type { AgentItem, CardColors } from "@/types/ui/inbox";

export function AgentCard({
  item,
  colors,
}: {
  item: AgentItem;
  colors: CardColors;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/notifications/[id]",
          params: { id: item.id },
        })
      }
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
          name={{
            ios: "arrow.triangle.2.circlepath",
            android: "autorenew",
            web: "autorenew",
          }}
          size={16}
          tintColor={colors.accent}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: "500",
              lineHeight: 18,
              color: colors.foreground,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <LiveDot />
        </View>
        <Text
          style={{
            fontSize: 11,
            lineHeight: 16,
            color: colors.muted,
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
          }}
        >
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
          >
            {item.runId}
          </Text>
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
          >
            elapsed {item.elapsed}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          color: colors.muted,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {item.time}
      </Text>
    </Pressable>
  );
}
