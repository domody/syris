import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { ApprovalDetail } from "@/components/notif-detail-approval";
import { EscalationDetail } from "@/components/notif-detail-escalation";
import { InfoDetail } from "@/components/notif-detail-info";
import { AgentDetail } from "@/components/notif-detail-agent";
import { INITIAL_INBOX } from "@/data/mock";
import { type Theme } from "@/theme";

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme<Theme>();

  const item = INITIAL_INBOX.find((i) => i.id === id);

  if (!item) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.muted }}>Notification not found.</Text>
      </View>
    );
  }

  if (item.kind === "approval") return <ApprovalDetail item={item} />;
  if (item.kind === "escalation") return <EscalationDetail item={item} />;
  if (item.kind === "info") return <InfoDetail item={item} />;
  if (item.kind === "agent") return <AgentDetail item={item} />;

  return null;
}
