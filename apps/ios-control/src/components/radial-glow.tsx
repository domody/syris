// components/RadialGlow.tsx
import { BlurMask, Canvas, Circle } from "@shopify/react-native-skia";

interface RadialGlowProps {
  size?: number;
  color?: string;
  opacity?: number;
  blur?: number;
  style?: object;
}

export function RadialGlow({
  size = 120,
  color = "#378ade",
  opacity = 0.5,
  blur = 25,
  style,
}: RadialGlowProps) {
  return (
    <Canvas
      style={[{ width: size, height: size, position: "absolute" }, style]}
      pointerEvents="none"
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        color={color}
        opacity={opacity}
      >
        <BlurMask blur={blur} style="normal" />
      </Circle>
    </Canvas>
  );
}
