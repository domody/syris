import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import type { Theme } from "@/theme";

type SectionHeaderProps = {
  title: string;
  trailing?: React.ReactNode;
};

export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  const { colors, spacing } = useTheme<Theme>();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[12],
        paddingVertical: spacing[8],
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: colors.muted,
        }}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}
