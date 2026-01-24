"use client";

import * as React from "react";

import { SyrisCard } from "@/components/ui/syirs-card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  MealItemBase,
  MealItemPortion,
  MealItemSnapshot,
  PortionUnit,
  PortionUnitSchema,
} from "@/types/meals";
import { MealsClient } from "@/lib/data/meals.client";
import { CaloriesRadialChart } from "@/components/data/calories-radial";
import { MacronutrientProgress } from "@/components/data/macros-progress";
import { UserGoals } from "@/types/user";

export function ItemEditors({
  meal_item_id,
  portion,
  snapshot,
  base,
  goals,
}: {
  meal_item_id: string;
  portion: MealItemPortion;
  snapshot: MealItemSnapshot;
  base: MealItemBase;
  goals: Omit<UserGoals, "id" | "user_id">;
}) {
  const mealsClient = React.useMemo(() => new MealsClient(), []);
  const [unit, setUnit] = React.useState<PortionUnit>(portion.unit);
  const [amount, setAmount] = React.useState<number>(portion.amount);

  const derived = React.useMemo(() => {
    const protein_per_100g = base.protein_g!;
    const carbs_per_100g = base.carbs_g!;
    const fat_per_100g = base.fat_g!;

    const kcal = snapshot.kcal;
    const protein = amount * (protein_per_100g / 100);
    const carbs = amount * (carbs_per_100g / 100);
    const fat = amount * (fat_per_100g / 100);
    // e.g. grams = amount * gramsPerServing
    // macros = grams * per100g / 100
    return {
      kcal,
      protein,
      carbs,
      fat,
    };
  }, [amount, base, portion.unit]);

  const kcal = derived.kcal;
  const protein_g = derived.protein;
  const carbs_g = derived.carbs;
  const fat_g = derived.fat;

  React.useEffect(() => {
    if (amount === portion.amount) return;

    const handle = window.setTimeout(async () => {
      try {
        await mealsClient.updateMealSnapshot(meal_item_id, amount);
      } catch (e) {
        console.log(e);
      }
    }, 500); // debounce delay

    return () => window.clearTimeout(handle);
  }, [amount, meal_item_id, mealsClient, portion.amount]);

  async function onUpdateAmount() {
    try {
      await mealsClient.updateMealSnapshot(meal_item_id, amount);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <SyrisCard title={"Portion Size"} contentVariant="list">
        <Item variant={"muted"}>
          <ItemContent>
            <ItemDescription>Serving Unit</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Select defaultValue={unit} disabled>
              <SelectTrigger className="w-full max-w-36">
                <SelectValue placeholder="Select a serving unit" />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectGroup>
                  {PortionUnitSchema.options.map((unit) => {
                    return (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </ItemActions>
        </Item>

        <Item variant={"muted"}>
          <ItemContent>
            <ItemDescription>Number of Servings</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Input
              className="text-right w-min max-w-36"
              type="number"
              placeholder="Enter a serving amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              onBlur={() =>
                mealsClient.updateMealSnapshot(meal_item_id, amount)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                mealsClient.updateMealSnapshot(meal_item_id, amount)
              }
            />
          </ItemActions>
        </Item>
      </SyrisCard>

      <SyrisCard title={"Energy Summary"} contentVariant="panel">
        <div className="w-full grid grid-cols-2 gap-2">
          <CaloriesRadialChart
            chartData={[
              {
                protein: (protein_g || 0) * 4,
                carbs: (carbs_g || 0) * 4,
                fats: (fat_g || 0) * 9,
              },
            ]}
          />
          <div className="flex items-start justify-center flex-col gap-2">
            <p>
              <span className="text-chart-1 font-semibold">Protein</span> -{" "}
              {protein_g || 0}g
            </p>
            <p>
              <span className="text-chart-2 font-semibold">Carbs</span> -{" "}
              {carbs_g || 0}g
            </p>
            <p>
              <span className="text-chart-3 font-semibold">Fat</span> -{" "}
              {fat_g || 0}g
            </p>
          </div>
        </div>
      </SyrisCard>

      <SyrisCard title={"Macronutreint Targets"} contentVariant="panel">
        <MacronutrientProgress
          macro={"kcal"}
          value={(protein_g || 0) * 4 + (carbs_g || 0) * 4 + (fat_g || 0) * 9}
          target={goals?.kcal_target}
        />
        {goals.protein_g_target && (
          <MacronutrientProgress
            macro={"protein"}
            value={protein_g || 0}
            target={goals.protein_g_target}
          />
        )}

        {goals.carbs_g_target && (
          <MacronutrientProgress
            macro={"carbs"}
            value={carbs_g || 0}
            target={goals.carbs_g_target}
          />
        )}

        {goals.fat_g_target && (
          <MacronutrientProgress
            macro={"fat"}
            value={fat_g || 0}
            target={goals.fat_g_target}
          />
        )}
      </SyrisCard>
    </>
  );
}
