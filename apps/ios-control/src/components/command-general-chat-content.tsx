import { useTheme } from "@shopify/restyle";
import { Text } from "react-native";

import type { Theme } from "@/theme";
import type { GeneralChatResponse } from "@/types";

export function GeneralChatContent({ r }: { r: GeneralChatResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <Text style={{ fontSize: 12.5, color: colors.foreground, lineHeight: 20 }}>
      {r.text}
    </Text>
  );
}
