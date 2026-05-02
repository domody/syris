import { useTheme } from "@shopify/restyle";
import { Pressable, Text } from "react-native";

import type { Theme } from "@/theme";

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme<Theme>();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: active ? colors.foreground : colors.elementBg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: active ? colors.background : colors.chipInactiveLabel,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
