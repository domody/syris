import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { formatDate } from "@/helpers/audit";
import { monoFont, type Theme } from "@/theme";

export function DayDivider({ iso }: { iso: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
        {formatDate(iso)}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}
