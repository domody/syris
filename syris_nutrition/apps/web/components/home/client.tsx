"use client";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Coffee02Icon,
  CookieIcon,
  Sandwich,
  SpaghettiIcon,
} from "@hugeicons/core-free-icons";
import {
  MealType,
  MealSchema,
  MealItemSchema,
  MealItemSnapshotSchema,
} from "@/types/meals";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type MacroObject = {
  value: number;
  pct: number;
};
type MacroPct = { c: number; p: number; f: number };
type MacroInfo = { c: MacroObject; p: MacroObject; f: MacroObject };
type DiaryMealVM = {
  mealType: MealType;
  mealId?: string;
  date: string;
  label: string;
  itemsPreview: string;
  kcal: number;
  macroPct: MacroPct;
  itemCount: number;
};
type MealRowProps = {
  vm: DiaryMealVM;
};

export function MealItem({ vm }: MealRowProps) {
  const router = useRouter();
  const { label, icon } = MEAL_CONFIG[vm.mealType];

  return (
    <Item variant="muted" className="flex-nowrap">
      <Link
        href={`/diary/${vm.date}/${vm.mealType}`}
        className="flex items-center flex-wrap gap-2.5 w-full"
      >
        <ItemMedia variant="icon">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </ItemMedia>

        <ItemContent>
          <ItemTitle>{vm.label}</ItemTitle>
          <ItemDescription>{vm.itemsPreview}</ItemDescription>
          <ItemDescription>
            {vm.kcal} kcals | <b>C</b> {vm.macroPct.c}% <b>P</b> {vm.macroPct.p}
            % <b>F</b> {vm.macroPct.f}%
          </ItemDescription>
        </ItemContent>
      </Link>
      <ItemActions>
        <Button variant="secondary" asChild>
          <Link href={`/add?prefillType=${vm.mealType}`}>Log</Link>
        </Button>
      </ItemActions>
    </Item>
  );
}
