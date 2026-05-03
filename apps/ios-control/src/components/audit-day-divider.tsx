import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { formatDate, formatRelative } from "@/helpers/audit";
import { monoFont, type Theme } from "@/theme";
import { Middot } from "./mid-dot";

export function DayDivider({ iso, count = 0 }: { iso: string, count: number }) {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ backgroundColor: colors.background, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 10}}>
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted}}>
        {formatRelative(iso)} <Middot /> {count} Event{count == 1 ? null : "s"}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}>
        {formatDate(iso)}
      </Text>
    </View>
  );
}
