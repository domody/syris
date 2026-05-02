import { useTheme } from "@shopify/restyle";
import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, TextInput } from "react-native";

import type { Theme } from "@/theme";

export function FloatingInputBar({ onSend }: { onSend: (text: string) => void }) {
  const { colors, borderRadii } = useTheme<Theme>();
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <GlassView
      style={{
        marginHorizontal: 12,
        marginBottom: 20,
        borderRadius: borderRadii.full,
        // backgroundColor: colors.card,
        borderWidth: 1,
        // borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingRight: 10,
        paddingLeft: 14,
        gap: 10,
        // position: "absolute",
        // top: 4,
        // left: 8,
      }}
    >
      <SymbolView
        name={{ ios: "terminal", android: "code", web: "code" }}
        size={16}
        tintColor={colors.muted}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Tell SYRIS what to do…"
        placeholderTextColor={colors.muted}
        style={{ flex: 1, fontSize: 14, color: colors.foreground, height: 40 }}
        returnKeyType="send"
        blurOnSubmit
        onSubmitEditing={handleSend}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: borderRadii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: canSend ? colors.accent : colors.elementBg,
          opacity: canSend && pressed ? 0.7 : 1,
        })}
      >
        <SymbolView
          name={{
            ios: "arrow.up",
            android: "arrow_upward",
            web: "arrow_upward",
          }}
          size={16}
          tintColor={canSend ? colors.white : colors.muted}
        />
      </Pressable>
    </GlassView>
  );
}
