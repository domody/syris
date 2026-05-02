import { useTheme } from "@shopify/restyle";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, View } from "react-native";

import { type Theme } from "@/theme";
import { router } from "expo-router";
import { RadialGlow } from "./radial-glow";

type LiveActivityCardProps = {
  children: React.ReactNode;
};

export function LiveActivityCard({ children }: LiveActivityCardProps) {
  const { colors, borderRadii, spacing } = useTheme<Theme>();

  return (
    <Pressable
      style={({ pressed }) => ({
        borderRadius: borderRadii.xl,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.accentSubtle40,
        opacity: pressed ? 0.7 : 1,
      })}
      onPress={() =>
        router.push({ pathname: "/task/[id]", params: { id: "done" } })
      }
    >
      <LinearGradient
        style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
        colors={["rgba(55,138,222,0.18)", "rgba(23,23,23,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <RadialGlow
        size={120}
        opacity={0.4}
        blur={30}
        style={Platform.select({
          ios: { top: -90, right: -90 },
          default: { top: -40, right: -40 },
        })}
      />
      <View style={{ padding: spacing[16] }}>{children}</View>
    </Pressable>
  );
}
