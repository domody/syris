import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import type { Theme } from "@/theme";

export function UnderstoodRow({ label }: { label: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Understood
      </Text>
      <Text style={{ fontSize: 12.5, color: colors.foreground }}>{label}</Text>
    </View>
  );
}
