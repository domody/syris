import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { monoFont, type Theme } from "@/theme";
import type { Lane } from "@/types/api/responses";

export function LaneChip({ lane }: { lane: Lane }) {
  const { colors } = useTheme<Theme>();

  if (lane === "fast") {
    return (
      <View
        style={{
          height: 16,
          paddingHorizontal: 6,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.successSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            fontFamily: monoFont,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.successEmphasis,
          }}
        >
          Fast path
        </Text>
      </View>
    );
  }
  if (lane === "task") {
    return (
      <View
        style={{
          height: 16,
          paddingHorizontal: 6,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            fontFamily: monoFont,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.accentEmphasis,
          }}
        >
          Task created
        </Text>
      </View>
    );
  }
  if (lane === "gated") {
    return (
      <View
        style={{
          height: 16,
          paddingHorizontal: 6,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.warningSubtle,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            fontFamily: monoFont,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.warningEmphasis,
          }}
        >
          Gated Â· approval
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        height: 16,
        paddingHorizontal: 6,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.elementBgSubtle,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "600",
          fontFamily: monoFont,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: colors.llmLaneText,
        }}
      >
        LLM lane
      </Text>
    </View>
  );
}
