import { useTheme } from "@shopify/restyle";
import { View } from "react-native";

import type { Theme } from "@/theme";

export function UnreadDot() {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        position: "absolute",
        width: 6,
        height: 6,
        borderRadius: 9999,
        backgroundColor: colors.info,
        left: 6,
        top: 22,
      }}
    />
  );
}
