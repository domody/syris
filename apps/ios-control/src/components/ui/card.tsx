import { useTheme } from "@shopify/restyle";
import { Pressable, View } from "react-native";

import type { Theme } from "@/theme";

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
};

export function Card({ children, onPress }: CardProps) {
  const { colors, spacing, borderRadii } = useTheme<Theme>();
  const baseStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadii.xl,
    padding: spacing[16],
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && { opacity: 0.7 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={baseStyle}>{children}</View>;
}
