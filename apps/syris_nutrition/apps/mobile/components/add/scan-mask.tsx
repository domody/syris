import React from "react";
import { View, useWindowDimensions } from "react-native";

type ScanMaskProps = {
  boxSize?: number; // size of the clear center square
  boxRadius?: number; // rounded corners for the frame
  overlayOpacity?: number; // darkness outside the hole
  borderWidth?: number;
};

export function ScanMask({
  boxSize = 260,
  boxRadius = 18,
  overlayOpacity = 0.55,
  borderWidth = 3,
}: ScanMaskProps) {
  const { width, height } = useWindowDimensions();

  const left = Math.round((width - boxSize) / 2);
  const top = Math.round((height - boxSize) / 2);

  const overlayColor = `rgba(0,0,0,${overlayOpacity})`;

  return (
    // pointerEvents none so it doesn't block presses on your UI
    <View pointerEvents="none" className="absolute inset-0">
      {/* Scan frame */}
      <View
        style={{
          position: "absolute",
          top,
          left,
          width: boxSize,
          height: boxSize,
          borderRadius: boxRadius,
          borderWidth,
          borderColor: "rgba(255,255,255,0.85)",
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
}
