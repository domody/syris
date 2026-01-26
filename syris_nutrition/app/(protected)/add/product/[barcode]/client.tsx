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
import { ProductLite } from "@/types/product";

export function ItemEditors({
  product_lite,
  goals,
}: {
  product_lite: ProductLite;
  goals: Omit<UserGoals, "id" | "user_id">;
}) {
  const mealsClient = React.useMemo(() => new MealsClient(), []);
  const [unit, setUnit] = React.useState<PortionUnit>(
    product_lite.serving_unit as PortionUnit,
  );
  const [amount, setAmount] = React.useState<number>(
    Number(product_lite.serving_amount),
  );

  const base = product_lite.nutrients_per_100;

  const derived = React.useMemo(() => {
    const kcal_per_100g = base["energy-kcal"]!;
    const protein_per_100g = base["proteins"];
    const carbs_per_100g = base["carbohydrates"];
    const fat_per_100g = base["fat"];

    if (unit == "g" || unit == "ml") {
      const kcal = amount * (kcal_per_100g / 100);
      const protein = amount * (protein_per_100g / 100);
      const carbs = amount * (carbs_per_100g / 100);
      const fat = amount * (fat_per_100g / 100);
      return {
        kcal,
        protein,
        carbs,
        fat,
      };
    } else {
      const kcal =
        amount * (kcal_per_100g * (Number(product_lite.serving_amount) / 100));
      const protein =
        amount *
        (protein_per_100g * (Number(product_lite.serving_amount) / 100));
      const carbs =
        amount * (carbs_per_100g * (Number(product_lite.serving_amount) / 100));
      const fat =
        amount * (fat_per_100g * (Number(product_lite.serving_amount) / 100));
      return {
        kcal,
        protein,
        carbs,
        fat,
      };
    }
  }, [amount, base, unit]);

  const kcal = derived.kcal;
  const protein_g = derived.protein;
  const carbs_g = derived.carbs;
  const fat_g = derived.fat;

  return (
    <>
      <SyrisCard title={"Serving Reference"} contentVariant="list">
        <Item variant={"muted"}>
          <ItemContent>
            <ItemDescription>Serving Size</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ItemDescription>{product_lite.serving_label}</ItemDescription>
          </ItemActions>
        </Item>
      </SyrisCard>

      <SyrisCard title={"Portion Size"} contentVariant="list">
        <Item variant={"muted"}>
          <ItemContent>
            <ItemDescription>Serving Size</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Input
              className="text-right w-min max-w-36"
              type="number"
              placeholder="Enter a serving amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              //   onBlur={() =>
              //     mealsClient.updateMealSnapshot(meal_item_id, amount)
              //   }
              //   onKeyDown={(e) =>
              //     e.key === "Enter" &&
              //     mealsClient.updateMealSnapshot(meal_item_id, amount)
              //   }
            />
          </ItemActions>
        </Item>

        <Item variant={"muted"}>
          <ItemContent>
            <ItemDescription>Serving Unit</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Select defaultValue={unit} value={unit} onValueChange={(value: PortionUnit) => setUnit(value)}>
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
