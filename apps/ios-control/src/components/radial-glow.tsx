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
  blur = 0,
  style,
}: RadialGlowProps) {
  const padding = blur * 2; // give the blur room to bleed out
  const canvasSize = size + padding * 2;
  const center = canvasSize / 2;

  return (
    <Canvas
      style={[
        {
          width: canvasSize,
          height: canvasSize,
          position: "absolute",
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Circle
        cx={center}
        cy={center}
        r={size / 2}
        color={color}
        opacity={opacity}
      >
        <BlurMask blur={blur} style="normal" />
      </Circle>
    </Canvas>
  );
}
