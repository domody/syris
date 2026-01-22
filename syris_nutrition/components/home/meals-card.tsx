import { z } from "zod";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SyrisCard } from "../ui/syirs-card";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  Coffee02Icon,
  CookieIcon,
  Sandwich,
  SpaghettiIcon,
} from "@hugeicons/core-free-icons";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import {
  MealType,
  MealSchema,
  MealItemSchema,
  MealItemSnapshotSchema,
} from "@/types/meals";
import { todayDate } from "@/utils/date";

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

import { getMealsWithItems } from "@/lib/data/meals.server";
import { buildDiaryVM } from "@/lib/vm/diaryMeal";
export async function MealsCard() {
  const date = todayDate();
  const meals = await getMealsWithItems(date);
  const diaryVM = buildDiaryVM(meals);

  return (
    <SyrisCard
      title="Diary"
      action={
        <Button variant="ghost" size="icon-lg">
          <HugeiconsIcon
            icon={ArrowUp01Icon}
            strokeWidth={2}
            className="rotate-180"
          />
        </Button>
      }
      contentVariant="list"
    >
      {diaryVM?.map((vm) => {
        return <MealItem key={vm.mealId} vm={vm} />;
      })}
    </SyrisCard>
  );
}

const MEAL_CONFIG: Record<MealType, { label: string; icon: any }> = {
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

type MealRowProps = {
  vm: DiaryMealVM;
};

function MealItem({ vm }: MealRowProps) {
  const { label, icon } = MEAL_CONFIG[vm.mealType];

  return (
    <Item variant="muted">
      <ItemMedia variant="icon">
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </ItemMedia>

      <ItemContent>
        <ItemTitle>{vm.label}</ItemTitle>
        <ItemDescription>{vm.itemsPreview}</ItemDescription>
        <ItemDescription>
          {vm.kcal} kcals | <b>C</b> {vm.macroPct.c}% <b>P</b> {vm.macroPct.p}%{" "}
          <b>F</b> {vm.macroPct.f}%
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        <Button variant="secondary">
          {vm.itemCount === 0 ? "Log" : "View"}
        </Button>
      </ItemActions>
    </Item>
  );
}
