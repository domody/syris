import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

import { ComponentExample } from "../component-example";

import { cn } from "@/lib/utils";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  MoreVerticalIcon,
  Coffee02Icon,
  CookieIcon,
  Sandwich,
  SpaghettiIcon,
} from "@hugeicons/core-free-icons";

export function HomePage() {
  return (
    <div
      className={cn(
        "mx-auto px-4 flex flex-col min-h-screen w-full max-w-5xl min-w-0 justify-start items-start 2xl:max-w-6xl",
      )}
    >
      {/* top bar */}
      <div className="h-20 w-full flex items-center justify-between">
        <div className="flex items-center justify-start gap-2 [&_svg:not([class*='size-'])]:size-4">
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} />
          <p className="text-lg">Today</p>
          <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} />
        </div>
        <div className="flex items-center">
          <Button variant={"ghost"} size={"icon-lg"}>
            <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
          </Button>
        </div>
      </div>
      <div className="w-full flex flex-col items-start justify-start gap-y-4">
        <MacronutrientTargetCard />
        <MealsCard />
      </div>
    </div>
  );
}

function MacronutrientTargetCard() {
  return (
    <Card className="w-full max-w-md overflow-hidden bg-transparent gap-0 ring-0 p-0">
      <CardHeader className="px-0">
        <CardDescription className="mt-1.5">
          Macronutrient Targets
        </CardDescription>
        <CardAction>
          <Button variant={"ghost"} size={"icon-lg"}>
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              strokeWidth={2}
              className="rotate-180"
            />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-2 items-start justify-start px-0 flex-1 bg-muted/50 p-3 rounded-md">
        <ProgressBar />
        <ProgressBar />
        <ProgressBar />
        <ProgressBar />
      </CardContent>
    </Card>
  );
}

function ProgressBar() {
  const macro = "Energy";
  const current = "1672.2";
  const goal = "1735.6";
  const unit = "kcal";
  const percent = 95;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between w-full">
        <p>
          <b>{macro}</b> - {current} / {goal} {unit}
        </p>
        <p className={`${percent > 100 ? "text-orange-400" : ""}`}>
          {percent}%
        </p>
      </div>
      <div className="w-full h-2 relative overflow-hidden rounded-full bg-red-500/50">
        <div
          className="h-full absolute top-0 left-0 bg-red-500"
          style={{ width: `${percent > 100 ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}

function MealsCard() {
  return (
    <Card className="w-full max-w-md overflow-hidden bg-transparent gap-0 ring-0 p-0">
      <CardHeader className="px-0">
        <CardDescription className="mt-1.5">Diary</CardDescription>
        <CardAction>
          <Button variant={"ghost"} size={"icon-lg"}>
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              strokeWidth={2}
              className="rotate-180"
            />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="gap-y-2 flex flex-col items-start justify-start px-0 flex-1">
        <MealItem mealType={"breakfast"} />
        <MealItem mealType={"snack"} />
        <MealItem mealType={"lunch"} />
        <MealItem mealType={"snack"} />
        <MealItem mealType={"dinner"} />
      </CardContent>
    </Card>
  );
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
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

type MealItemProps = {
  mealType: MealType;
};

function MealItem({ mealType }: MealItemProps) {
  const { label, icon } = MEAL_CONFIG[mealType];

  return (
    <Item variant={"muted"}>
      <ItemMedia variant="icon">
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
        <ItemDescription>Greek Yogurt and 4 more</ItemDescription>
        <ItemDescription>
          420 kcals | <b>C</b> 20% <b>P</b> 20% <b>F</b> 20%
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant={"secondary"}>Log</Button>
      </ItemActions>
    </Item>
  );
}

// Breakfast: Coffee02Icon
// Lunch: Sandwich
// Dinner: SpaghettiIcon
// Snack: CookieIcon
