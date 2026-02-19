import { cn } from "@/lib/utils";
import * as ProgressPrimitive from "@rn-primitives/progress";
import { Platform, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ProgressPrimitive.RootProps &
  React.RefAttributes<ProgressPrimitive.RootRef> & {
    indicatorClassName?: string;
  }) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "bg-muted h-1 rounded-md relative flex w-full items-center overflow-hidden",
        className,
      )}
      {...props}
    >
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

const Indicator = Platform.select({
  web: WebIndicator,
  native: NativeIndicator,
  default: NullIndicator,
});

type IndicatorProps = {
  value: number | undefined | null;
  className?: string;
};

function WebIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View
      className={cn(
        "bg-primary h-full w-full flex-1 transition-all",
        className,
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    >
      <ProgressPrimitive.Indicator className={cn("h-full w-full", className)} />
    </View>
  );
}

function NativeIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS === "web") return null;
  
  const progress = useDerivedValue(() => value ?? 0, [value]);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(progress.value, [0, 100], [1, 100], Extrapolation.CLAMP)}%`,
        { overshootClamping: true },
      ),
    };
  }, [value]);

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View
        // style={[
        //   // { width: "100%", height: "100%", transformOrigin: "left" as any },
        //   indicator,
        // ]}
        style={{
          width: `${value as number}%`
        }}
        className={cn("bg-primary mr-auto h-full", className)}
      />
    </ProgressPrimitive.Indicator>
  );
}

function NullIndicator(_props: IndicatorProps) {
  return null;
}
