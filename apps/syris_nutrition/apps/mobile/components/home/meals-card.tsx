import { SyrisCard } from "../common/syris-card";
import { MealItem } from "../common/meal-item";
import { useMealsDay } from "@/hooks/meals.hooks";

export function MealsCard() {
  const { data: meals, isLoading, error } = useMealsDay("2026-01-22");

  return (
    <SyrisCard title="Diary">
      {meals?.map((meal) => {
        return <MealItem key={meal.id} meal={meal} />;
      })}
    </SyrisCard>
  );
}
