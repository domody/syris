import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { stageColorKey } from "@/helpers/audit";
import { monoFont, type Theme } from "@/theme";
import type { AuditEventStage } from "@/types";

export function StageChip({ stage }: { stage: AuditEventStage }) {
  const { colors } = useTheme<Theme>();
  const color = colors[stageColorKey(stage)] as string;
  return (
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: color + "22",
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0.6,
          color,
        }}
      >
        {stage}
      </Text>
    </View>
  );
}
