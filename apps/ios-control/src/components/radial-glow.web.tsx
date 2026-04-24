import { View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

interface RadialGlowProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: object;
}

export function RadialGlow({
  size = 120,
  color = "55,138,222",
  opacity = 0.4,
  style,
}: RadialGlowProps) {
  return (
    <View
      pointerEvents="none"
      style={[{ width: size, height: size, position: "absolute" }, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop
              offset="0%"
              stopColor={`rgb(${color})`}
              stopOpacity={opacity}
            />
            <Stop offset="100%" stopColor={`rgb(${color})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}
