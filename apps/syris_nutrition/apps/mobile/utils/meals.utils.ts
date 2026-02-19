import { MealItemWithDetails } from "@/api/meals.api";
import { asNum } from "./helpers";
import { MealType } from "@/types/meals";
import { Coffee02Icon, CookieIcon, Sandwich, SpaghettiIcon } from "@hugeicons/core-free-icons";

export const MEAL_CONFIG: Record<MealType, { label: string; icon: any }> = {
  breakfast: {
    label: "Breakfast",
    icon: Coffee02Icon,
  },
  lunch: {
    label: "Lunch",
    icon: Sandwich,
  },
  dinner: {
    label: "Dinner",
    icon: SpaghettiIcon,
  },
  snack: {
    label: "Snack",
    icon: CookieIcon,
  },
};

export function previewFromNames(names: string[]): string {
  if (names.length === 0) return "No items logged";
  if (names.length === 1) return names[0];
  return `${names[0]} and ${names.length - 1} more`;
}

export function totalsFromItems(items: MealItemWithDetails[]) {
  const totals = items.reduce(
    (acc, item) => {
      const snap = item.snapshot;
      acc.kcal += asNum(snap?.kcal);
      acc.protein += asNum(snap?.protein_g);
      acc.carbs += asNum(snap?.carbs_g);
      acc.fat += asNum(snap?.fat_g);
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return totals;
}

export function marcoMealPercentagesFromTotals(
  kcal: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
) {
  return {
    p: Math.round(((protein_g * 4) / kcal) * 100),
    c: Math.round(((carbs_g * 4) / kcal) * 100),
    f: Math.round(((fat_g * 9) / kcal) * 100),
  };
}
