import { View } from "react-native";

import { AgentCard } from "@/components/inbox-agent-card";
import { AlarmCard } from "@/components/inbox-alarm-card";
import { ApprovalCard } from "@/components/inbox-approval-card";
import { EscalationCard } from "@/components/inbox-escalation-card";
import { InfoCard } from "@/components/inbox-info-card";
import type { InboxItem } from "@/types/api/inbox";
import type { CardColors } from "@/types/ui/inbox";

export function InboxRow({
  item,
  colors,
  isLast,
}: {
  item: InboxItem;
  colors: CardColors;
  isLast: boolean;
}) {
  return (
    <>
      {item.kind === "approval" && <ApprovalCard item={item} colors={colors} />}
      {item.kind === "escalation" && (
        <EscalationCard item={item} colors={colors} />
      )}
      {item.kind === "agent" && <AgentCard item={item} colors={colors} />}
      {item.kind === "info" && <InfoCard item={item} colors={colors} />}
      {item.kind === "alarm" && <AlarmCard item={item} colors={colors} />}
      {!isLast && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginHorizontal: 14,
          }}
        />
      )}
    </>
  );
}
