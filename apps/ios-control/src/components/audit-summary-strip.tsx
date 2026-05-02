import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { outcomeCount } from "@/helpers/audit";
import type { Theme } from "@/theme";
import type { AuditEvent } from "@/types";

export function SummaryStrip({ events }: { events: AuditEvent[] }) {
  const { colors } = useTheme<Theme>();

  const cells: { label: string; count: number; color: string }[] = [
    {
      label: "Success",
      count: outcomeCount(events, "success"),
      color: colors.successEmphasis,
    },
    {
      label: "Failure",
      count: outcomeCount(events, "failure"),
      color: colors.errorEmphasis,
    },
    {
      label: "Suppressed",
      count: outcomeCount(events, "suppressed"),
      color: colors.muted,
    },
    {
      label: "Info",
      count: outcomeCount(events, "info"),
      color: colors.accentEmphasis,
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {cells.map((cell, i) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
            borderLeftWidth: i > 0 ? 1 : 0,
            borderLeftColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: cell.color }}>
            {cell.count}
          </Text>
          <Text style={{ fontSize: 9, color: colors.muted, marginTop: 1 }}>
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
