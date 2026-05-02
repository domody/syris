import { useTheme } from "@shopify/restyle";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text, View } from "react-native";

import { monoFont, type Theme } from "@/theme";

export function ThinkingBubble() {
  const { colors } = useTheme<Theme>();
  const o1 = useSharedValue(0.4);
  const o2 = useSharedValue(0.4);
  const o3 = useSharedValue(0.4);

  useEffect(() => {
    const pulse = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.4, {
              duration: 480,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0.4, { duration: 240 }),
          ),
          -1,
          false,
        ),
      );
    o1.value = pulse(0);
    o2.value = pulse(150);
    o3.value = pulse(300);
  }, [o1, o2, o3]);

  const s1 = useAnimatedStyle(() => ({ opacity: o1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: o2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: o3.value }));

  const dotStyle = {
    width: 5,
    height: 5,
    borderRadius: 9999,
    backgroundColor: colors.muted,
  };

  return (
    <View style={{ alignItems: "flex-start", gap: 4 }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Animated.View style={[dotStyle, s1]} />
        <Animated.View style={[dotStyle, s2]} />
        <Animated.View style={[dotStyle, s3]} />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontFamily: monoFont,
          color: colors.muted,
          paddingHorizontal: 4,
        }}
      >
        routing · rules → LLM fallback
      </Text>
    </View>
  );
}
