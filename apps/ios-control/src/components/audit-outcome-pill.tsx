import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import {
    outcomeLabel,
    outcomeLabelBg,
    outcomeLabelColor,
} from "@/helpers/audit";
import { monoFont, type Theme } from "@/theme";
import type { AuditEventOutcome } from "@/types/api/audit";

export function OutcomePill({ outcome }: { outcome: AuditEventOutcome }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: outcomeLabelBg(outcome, colors),
      }}
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: "600",
          color: outcomeLabelColor(outcome, colors),
        }}
      >
        {outcomeLabel(outcome)}
      </Text>
    </View>
  );
}
