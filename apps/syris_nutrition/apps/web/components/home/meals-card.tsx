import { z } from "zod";


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

import { todayDate } from "@/utils/date";
import { getMealsWithItems } from "@/lib/data/meals.server";
import { buildDiaryVM } from "@/lib/vm/diaryMeal";
import { MealItem } from "./client";

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

