import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { UnderstoodRow } from "@/components/command-understood-row";
import { monoFont, type Theme } from "@/theme";
import type { DryRunResponse } from "@/types/api/responses";

export function DryRunContent({ r }: { r: DryRunResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <>
      <UnderstoodRow label={r.note} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 6,
          gap: 4,
        }}
      >
        {r.preview.map((line, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: monoFont,
                color: colors.successMid,
                marginTop: 1,
              }}
            >
              â†’
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: monoFont,
                color: colors.foreground,
                flex: 1,
                lineHeight: 17,
              }}
            >
              {line}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
