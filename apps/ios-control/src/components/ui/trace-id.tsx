import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "@shopify/restyle";

import { monoFont, type Theme } from "@/theme";

type TraceIdProps = {
  value: string;
};

export function TraceId({ value }: TraceIdProps) {
  const { colors } = useTheme<Theme>();
  const [copied, setCopied] = useState(false);

  const handlePress = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <Text
        style={{
          fontFamily: monoFont,
          fontSize: 12,
          color: colors.muted,
        }}
      >
        {copied ? "copied!" : value}
      </Text>
    </Pressable>
  );
}
