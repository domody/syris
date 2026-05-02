import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import type { Theme } from "@/theme";
import type { BadgeVariant } from "@/types/ui/badge";

export type { BadgeVariant };

type BadgeConfig = {
  bgKey: keyof Theme["colors"];
  textKey: keyof Theme["colors"];
};

const VARIANT_CONFIG: Record<BadgeVariant, BadgeConfig> = {
  success: { bgKey: "badgeSuccessBg", textKey: "successEmphasis" },
  warning: { bgKey: "badgeWarningBg", textKey: "warningEmphasis" },
  error: { bgKey: "badgeErrorBg", textKey: "errorEmphasis" },
  info: { bgKey: "badgeInfoBg", textKey: "accentEmphasis" },
  neutral: { bgKey: "badgeNeutralBg", textKey: "badgeNeutralText" },
};

type BadgeProps = {
  label: string;
  variant: BadgeVariant;
};

export function Badge({ label, variant }: BadgeProps) {
  const { colors } = useTheme<Theme>();
  const { bgKey, textKey } = VARIANT_CONFIG[variant];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
        backgroundColor: colors[bgKey] as string,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: colors[textKey] as string,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
