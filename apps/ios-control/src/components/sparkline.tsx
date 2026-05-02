import { useTheme } from "@shopify/restyle";
import { View } from "react-native";

import type { Theme } from "@/theme";

export function Sparkline({ data }: { data: number[] }) {
  const { colors, borderRadii } = useTheme<Theme>();
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 1, height: 44 }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            borderRadius: borderRadii.xs,
            backgroundColor: colors.accentSubtle40,
            height: (v / max) * 44,
          }}
        />
      ))}
    </View>
  );
}
