import { View, type ViewProps } from "react-native";
import { useTheme } from "@/providers/theme-provider";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useTheme().colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
