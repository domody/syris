import { useTheme } from "@shopify/restyle";
import { Text } from "react-native";

import type { Theme } from "@/theme";
import type { InformationalResponse } from "@/types/ui/command";

export function InformationalContent({ r }: { r: InformationalResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <Text style={{ fontSize: 12.5, color: colors.foreground, lineHeight: 20 }}>
      {r.answer}
    </Text>
  );
}
