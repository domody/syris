import { useEffectiveGoals } from "@/hooks/goals.hooks";
import { SyrisCard } from "../common/syris-card";
import { useDailyTotals } from "@/hooks/totals.hooks";
import { MacroKey, MacronutrientProgress } from "../common/macro-progress";
import { Text } from "../ui/text";
import { Key } from "@hugeicons/core-free-icons";

export function TargetsCard() {
  const {
    data: goals,
    isLoading,
    error: goalsError,
  } = useEffectiveGoals("2026-01-22");
  const { data: totals, error: totalsError } = useDailyTotals("2026-01-22");

  return (
    <SyrisCard title="Targets" contentVariant="panel">
      {goals &&
        totals &&
        Object.entries(goals)
          .filter(([key]) => /_target\s*$/.test(key))
          .map(([key, goal]) => {
            const current =
              totals[key.replace(/_target\s*$/, "") as keyof typeof totals];

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
