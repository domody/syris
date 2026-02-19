import React from "react";
import { Text } from "@/components/ui/text";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTheme } from "@/providers/theme-provider";
import { IconSvgElement } from "@hugeicons/react-native";

type HapticTabButtonProps = TabTriggerSlotProps & {
  icon: IconSvgElement;
  label: string;
};

export function HapticTabButton({
  isFocused,
  icon,
  label,
  className,
  ...props
}: HapticTabButtonProps) {
  const theme = useTheme();
  const tint = isFocused ? theme.colors.primary : theme.colors.foreground;

  return (
    <PlatformPressable
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      style={[
        {
          flexDirection: "column",
          flex: 1,
          width: "100%",
          justifyContent: "center",
          alignContent: "center",
          gap: 4,
        },
        // @ts-expect-error - style may exist depending on versions
        props.style,
      ]}
      className={className as any}
      {...props}
    >
      <HugeiconsIcon size={20} icon={icon} color={tint} />
      <Text
        className={cn(
          "text-xs",
          isFocused ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </Text>
    </PlatformPressable>
  );
}
