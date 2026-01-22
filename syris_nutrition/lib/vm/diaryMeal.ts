import { z } from "zod";

import {
  MealType,
  MealSchema,
  MealItemSchema,
  MealItemSnapshotSchema,
} from "@/types/meals";

const MEAL_CONFIG: Record<MealType, { label: string }> = {
  breakfast: {
    label: "Breakfast",
  },
  lunch: {
    label: "Lunch",
  },
  dinner: {
    label: "Dinner",
  },
  snack: {
    label: "Snack",
  },
};

const MealWithItemsSchema = MealSchema.extend({
  meal_items: z
    .array(
      MealItemSchema.extend({
        meal_item_snapshots: z.preprocess((v) => {
          if (v == null) return []; // undefined/null -> []
          return Array.isArray(v) ? v : [v]; // object -> [object]
        }, z.array(MealItemSnapshotSchema)),
      }),
    )
    .default([]),
});

type MealWithItems = z.infer<typeof MealWithItemsSchema>;

type MacroPct = { c: number; p: number; f: number };

type DiaryMealVM = {
  mealType: MealType;
  mealId?: string;
  label: string;
  itemsPreview: string;
  kcal: number;
  macroPct: MacroPct;
  itemCount: number;
};

function asNum(n: unknown): number {
  // Supabase numeric often comes back as string
  if (n == null) return 0;
  const x = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(x) ? x : 0;
}

function macroPctFromGrams(
  protein_g: number,
  carbs_g: number,
  fat_g: number,
): MacroPct {
  const pCal = protein_g * 4;
  const cCal = carbs_g * 4;
  const fCal = fat_g * 9;
  const total = pCal + cCal + fCal;
  if (total <= 0) return { c: 0, p: 0, f: 0 };

  return {
    c: Math.round((cCal / total) * 100),
    p: Math.round((pCal / total) * 100),
    f: Math.round((fCal / total) * 100),
  };
}

function previewFromNames(names: string[]): string {
  if (names.length === 0) return "No items logged";
  if (names.length === 1) return names[0];
  return `${names[0]} and ${names.length - 1} more`;
}

function toDiaryMealVM(meal: MealWithItems): DiaryMealVM {
  const mealType = meal.meal_type as MealType;
  const { label } = MEAL_CONFIG[mealType];

  const items = meal.meal_items ?? [];

  const totals = items.reduce(
    (acc, item) => {
      const snap = item.meal_item_snapshots?.[0]; // 1:1 but returned as array
      acc.kcal += asNum(snap?.kcal);
      acc.protein += asNum(snap?.protein_g);
      acc.carbs += asNum(snap?.carbs_g);
      acc.fat += asNum(snap?.fat_g);
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const names = items.map((i) => i.display_name).filter(Boolean);
  const pct = macroPctFromGrams(totals.protein, totals.carbs, totals.fat);

  return {
    mealType,
    mealId: meal.id,
    label,
    itemsPreview: previewFromNames(names),
    kcal: Math.round(totals.kcal),
    macroPct: pct,
    itemCount: items.length,
  };
}

export function buildDiaryVM(meals: MealWithItems[]): DiaryMealVM[] {
  return meals.flatMap(toDiaryMealVM);
}
