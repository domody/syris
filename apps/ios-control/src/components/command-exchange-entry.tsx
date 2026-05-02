import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { ChatBubbleSys } from "@/components/command-chat-bubble-sys";
import { ChatBubbleUser } from "@/components/command-chat-bubble-user";
import { ThinkingBubble } from "@/components/command-thinking-bubble";
import { monoFont, type Theme } from "@/theme";
import type { Exchange } from "@/types";

export function ExchangeEntry({ item }: { item: Exchange }) {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <ChatBubbleUser command={item.command} />
        <Text
          style={{
            fontSize: 10,
            fontFamily: monoFont,
            color: colors.muted,
            paddingHorizontal: 4,
          }}
        >
          {item.timestamp}
        </Text>
      </View>
      {item.response === null ? (
        <ThinkingBubble />
      ) : (
        <View style={{ alignItems: "flex-start", gap: 2 }}>
          <ChatBubbleSys response={item.response} />
          <Text
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              color: colors.muted,
              paddingHorizontal: 4,
            }}
          >
            {item.response.timestamp}
          </Text>
        </View>
      )}
    </View>
  );
}
