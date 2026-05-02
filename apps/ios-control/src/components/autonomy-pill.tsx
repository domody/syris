import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { monoFont, type Theme } from "@/theme";

export function AutonomyPill({ level }: { level: string | null }) {
  const { colors, spacing, borderRadii } = useTheme<Theme>();

  if (!level) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing[12],
          paddingVertical: spacing[4],
          borderRadius: borderRadii.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 12, fontFamily: monoFont }}>
          — autonomy
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[6],
        paddingHorizontal: spacing[12],
        paddingVertical: spacing[4],
        borderRadius: borderRadii.full,
        backgroundColor: colors.accentSubtle,
      }}
    >
      <Text
        style={{
          color: colors.accentMid,
          fontSize: 14,
          fontWeight: "600",
          fontFamily: monoFont,
        }}
      >
        {level}
      </Text>
      <Text style={{ color: colors.chipInactiveLabel, fontSize: 12 }}>
        scoped autonomy
      </Text>
    </View>
  );
}
