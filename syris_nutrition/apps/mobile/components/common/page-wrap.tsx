import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { View, ViewProps } from "react-native";

export function PageWrap({ style, className, ...props }: ViewProps) {
  const backgroundColor = useTheme().colors.background;

  return (
    <View
      className={cn(
        "mx-auto px-4 pb-16 flex flex-col min-h-screen w-full max-w-5xl min-w-0 justify-start items-start 2xl:max-w-6xl no-scrollbar",
        className,
      )}
      style={[{ backgroundColor }, style]}
      {...props}
    />
  );
}
