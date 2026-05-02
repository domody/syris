import { useTheme } from "@shopify/restyle";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { monoFont, type Theme } from "@/theme";

export function TracePill({ traceId, onPress }: { traceId: string; onPress: () => void }) {
  const { colors } = useTheme<Theme>();
  const [copied, setCopied] = useState(false);

  const handleLongPress = async () => {
    await Clipboard.setStringAsync(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: colors.accentSubtle,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          color: colors.accentEmphasis,
          fontWeight: "600",
        }}
      >
        {copied ? "copied!" : traceId}
      </Text>
    </Pressable>
  );
}
