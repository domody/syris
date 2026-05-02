import { useTheme } from "@shopify/restyle";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { Theme } from "@/theme";

export function LiveDot() {
  const { colors } = useTheme<Theme>();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 9999,
          backgroundColor: colors.info,
        },
        animStyle,
      ]}
    />
  );
}
