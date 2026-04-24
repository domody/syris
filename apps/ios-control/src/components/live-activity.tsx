import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";
import { RadialGlow } from "./radial-glow";

export function LiveActivityCard({
  children,
  ...props
}: React.ComponentProps<"div">) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Pressable className="relative overflow-hidden ring ring-accent/40 rounded-xl active:opacity-70">
      {/* linear bg and radial glow */}
      <LinearGradient
        className="absolute top-0 left-0 bottom-0 right-0"
        colors={["rgba(55,138,222,0.18)", "rgba(23,23,23,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <RadialGlow
        size={120}
        opacity={0.4}
        blur={30}
        style={{ top: -40, right: -40 }}
      />
      {/* content */}
      <View className="p-4">{children}</View>
    </Pressable>
  );
}

// <Pressable className="bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 rounded-xl p-4 active:opacity-70">
//   <View className="flex-row justify-between items-center mb-2">
//     <View className="flex-row items-center gap-2">
//       <SymbolView
//         name={{
//           ios: "arrow.triangle.2.circlepath",
//           android: "autorenew",
//           web: "autorenew",
//         }}
//         size={14}
//         tintColor={colors.accent}
//       />
//       <Text className="text-xs font-mono tracking-wider text-muted">
//         Agent <Middot /> morning_brief
//       </Text>
//     </View>
//     <Text className="text-xs font-mono text-muted tabular-nums">
//       00:47
//     </Text>
//   </View>

//   <Text className="text-[15px] font-medium tracking-tight text-foreground mb-2">
//     Drafting daily brief <Middot /> step 3 of 5
//   </Text>

//   <View className="h-1 bg-border rounded-full overflow-hidden mb-2.5">
//     <View
//       className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
//       style={{ width: "60%" }}
//     />
//   </View>

//   <View className="flex-row items-center gap-1.5">
//     <Badge label="LLM" variant="info" />
//     <Text className="text-[10px] font-mono text-muted">
//       synthesizing calendar + mail triage
//     </Text>
//   </View>
// </Pressable>
