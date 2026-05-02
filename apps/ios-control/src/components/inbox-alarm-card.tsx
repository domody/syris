import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";

import { UnreadDot } from "@/components/inbox-unread-dot";
import { Middot } from "@/components/mid-dot";
import { Badge } from "@/components/ui/badge";
import { monoFont } from "@/theme";
import type { AlarmItem } from "@/types";
import type { CardColors } from "@/types";

export function AlarmCard({
  item,
  colors,
}: {
  item: AlarmItem;
  colors: CardColors;
}) {
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
          name={{
            ios: "exclamationmark.triangle.fill",
            android: "warning",
            web: "warning",
          }}
          size={16}
          tintColor={colors.error}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            lineHeight: 18,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
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
