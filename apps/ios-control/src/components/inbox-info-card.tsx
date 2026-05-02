import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";

import { UnreadDot } from "@/components/inbox-unread-dot";
import { monoFont } from "@/theme";
import type { CardColors, InfoItem } from "@/types/ui/inbox";

export function InfoCard({
  item,
  colors,
}: {
  item: InfoItem;
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
          backgroundColor: colors.elementBgSubtle,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {item.eventId.startsWith("evt_") ? (
          <SymbolView
            name={{
              ios: "sensor.tag.radiowaves.forward",
              android: "sensors",
              web: "sensors",
            }}
            size={16}
            tintColor={colors.muted}
          />
        ) : item.eventId.startsWith("tmr_") ? (
          <SymbolView
            name={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            size={16}
            tintColor={colors.muted}
          />
        ) : (
          <SymbolView
            name={{
              ios: "calendar",
              android: "calendar_today",
              web: "calendar_today",
            }}
            size={16}
            tintColor={colors.muted}
          />
        )}
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
          style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
        >
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
          >
            {item.eventId}
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
