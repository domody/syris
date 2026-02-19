import { useEffectiveGoals } from "@/hooks/goals.hooks";
import { SyrisCard } from "../common/syris-card";
import { useDailyTotals } from "@/hooks/totals.hooks";
import { MacroKey, MacronutrientProgress } from "../common/macro-progress";
import { Text } from "../ui/text";
import { Key } from "@hugeicons/core-free-icons";

type TargetsOverride = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export function TargetsCard({ override }: { override?: TargetsOverride }) {
  const {
    data: goals,
    isLoading,
    error: goalsError,
  } = useEffectiveGoals("2026-01-22");
  const { data: totals, error: totalsError } = useDailyTotals("2026-01-22");

  const values = override ?? totals;

  return (
    <SyrisCard title="Targets" contentVariant="panel">
      {goals &&
        values &&
        Object.entries(goals)
          .filter(([key]) => /_target\s*$/.test(key))
          .map(([key, goal]) => {
            const current =
              values[key.replace(/_target\s*$/, "") as keyof typeof values];

            return (
              <MacronutrientProgress
                key={key}
                macro={key.replace(/(?:_(?:g|target))+\s*$/, "") as MacroKey}
                value={current as number}
                goal={goal as number}
              />
            );
          })}
    </SyrisCard>
  );
}
