import { useTheme } from "@shopify/restyle";
import { View } from "react-native";

import type { BadgeVariant } from "@/types/ui/badge";
import type { Theme } from "@/theme";

const DOT_COLOR_KEY: Record<BadgeVariant, keyof Theme["colors"]> = {
  success: "success",
  warning: "dotWarning",
  error: "error",
  info: "info",
  neutral: "dotNeutral",
};

type StatusDotProps = {
  variant: BadgeVariant;
};

export function StatusDot({ variant }: StatusDotProps) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 9999,
        backgroundColor: colors[DOT_COLOR_KEY[variant]] as string,
      }}
    />
  );
}
