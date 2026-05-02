import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import type { Theme } from "@/theme";

export function ChatBubbleUser({ command }: { command: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        alignSelf: "flex-end",
        maxWidth: "82%",
        backgroundColor: colors.accent,
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.white, lineHeight: 19 }}>
        {command}
      </Text>
    </View>
  );
}
