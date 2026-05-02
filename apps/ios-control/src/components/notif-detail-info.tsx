import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ScrollView, Text, View } from "react-native";

import {
    cleanTitle,
    CloseButton,
    DetailCard,
    HairlineDivider,
    KVRow,
    MonoBadge,
    OutlineButton,
} from "@/components/notif-detail-helpers";
import { Badge } from "@/components/ui/badge";
import { type Theme } from "@/theme";
import type { InfoItem } from "@/types/ui/inbox";

export function InfoDetail({ item }: { item: InfoItem }) {
  const router = useRouter();
  const { colors } = useTheme<Theme>();

  const traceId = "01JH7A1KZ2";

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
            <SymbolView
              name={{ ios: "info.circle", android: "info", web: "info" }}
              size={12}
              tintColor={colors.muted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.muted,
              }}
            >
              Informational · no action required
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "500",
              color: colors.foreground,
              lineHeight: 28,
            }}
          >
            {cleanTitle(item.title)}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <MonoBadge label={item.eventId} />
            <MonoBadge label={`trace ${traceId.slice(0, 8)}`} />
          </View>
        </View>

        {/* Event details */}
        <DetailCard>
          <KVRow label="Time" value="14:02:11" mono />
          <HairlineDivider />
          <KVRow label="Sensor" value="foyer.pir · dev_0x4A21" mono />
          <HairlineDivider />
          <KVRow label="Duration" value="2.4s" mono />
          <HairlineDivider />
          <KVRow label="Presence" value="away · last geofence exit 6h ago" />
          <HairlineDivider />
          <KVRow label="Rule" value="sensors.presence.cat" mono highlight />
          <HairlineDivider />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, flexShrink: 0 }}>
              Classified
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flexShrink: 1,
              }}
            >
              <Badge label="expected" variant="success" />
              <Text style={{ fontSize: 12, color: colors.muted }}>
                matched cat pattern (91% conf)
              </Text>
            </View>
          </View>
        </DetailCard>

        {/* No action */}
        <DetailCard>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 6,
            }}
          >
            No action taken
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 19.5, color: colors.muted }}>
            At A3, SYRIS suppresses notifications for expected cat motion unless
            anomalous. Logged for retention (30 days).
          </Text>
        </DetailCard>

        {/* Actions */}
        <OutlineButton
          label="Open trace · audit log"
          onPress={() => router.back()}
        />
        <View
          style={{
            alignItems: "center",
            paddingVertical: 13,
          }}
        >
          <Text
            style={{ fontSize: 15, fontWeight: "400", color: colors.muted }}
            onPress={() => router.back()}
          >
            Suppress future similar alerts
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
