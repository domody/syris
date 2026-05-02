import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";

import { UnreadDot } from "@/components/inbox-unread-dot";
import { Middot } from "@/components/mid-dot";
import { Badge } from "@/components/ui/badge";
import { RISK_VARIANT } from "@/helpers/inbox";
import { monoFont } from "@/theme";
import type { ApprovalItem } from "@/types/api/inbox";
import type { CardColors } from "@/types/ui/inbox";

export function ApprovalCard({
  item,
  colors,
}: {
  item: ApprovalItem;
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
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
          >
            {item.approvalId}
          </Text>
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Badge
            label={item.riskLevel}
            variant={RISK_VARIANT[item.riskLevel]}
          />
          <Text style={{ fontSize: 10, color: colors.separatorMuted }}>
            <Middot />
          </Text>
          <Text
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: colors.warningMid,
            }}
          >
            exp {item.expiresIn}
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
