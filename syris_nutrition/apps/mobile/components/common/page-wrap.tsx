import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { ScrollView, View, ViewProps } from "react-native";

type PageWrapProps = ViewProps & {
  withScrollView?: boolean; // default: true
  scrollViewClassName?: string; // optional if you ever want to override
};

export function PageWrap({
  style,
  className,
  children,
  withScrollView = true,
  scrollViewClassName,
  ...props
}: PageWrapProps) {
  const backgroundColor = useTheme().colors.background;

  const containerClassName = cn(
    "mx-auto flex flex-col flex-1 w-full max-w-5xl min-w-0 justify-start items-start 2xl:max-w-6xl no-scrollbar",
    !withScrollView && "px-4 pt-4 pb-16",
    className,
  );

  return (
    <View
      className={containerClassName}
      style={[{ backgroundColor }, style]}  
      {...props}
    >
      {withScrollView ? (
        <ScrollView
          className={cn(
            "flex flex-col flex-1 w-full px-4 pt-4 pb-16",
            scrollViewClassName,
          )}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}
