import { View } from "react-native";
import { Progress } from "../ui/progress";
import { Text, TextClassContext } from "../ui/text";

const macroMeta = {
  kcal: {
    label: "Energy",
    unit: "kcal",
    trackClass: "bg-amber-500/30",
    fillClass: "bg-amber-500",
  },
  protein: {
    label: "Protein",
    unit: "g",
    trackClass: "bg-blue-500/30",
    fillClass: "bg-blue-500",
  },
  carbs: {
    label: "Carbs",
    unit: "g",
    trackClass: "bg-violet-500/30",
    fillClass: "bg-violet-500",
  },
  fat: {
    label: "Fat",
    unit: "g",
    trackClass: "bg-emerald-500/30",
    fillClass: "bg-emerald-500",
  },
} as const;

export type MacroKey = keyof typeof macroMeta;

export function MacronutrientProgress({
  macro,
  value,
  goal,
}: {
  macro: MacroKey;
  value: number;
  goal: number;
}) {
  const safeGoal = goal > 0 ? goal : 1;
  const pctRaw = (value / safeGoal) * 100;
  const pct = Math.max(0, Math.min(100, pctRaw));
  
  return (
    <TextClassContext value="text-xs">
      <View className="w-full gap-1">
        <View className="flex-row items-center justify-between">
          <Text>
            {macroMeta[macro].label} - {value} / {goal} {macroMeta[macro].unit}
          </Text>
          <Text>{pct.toFixed(2)}%</Text>
        </View>
        <Progress value={pct} />
      </View>
    </TextClassContext>
  );
}
