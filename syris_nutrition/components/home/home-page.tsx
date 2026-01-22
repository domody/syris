import { Button } from "@/components/ui/button";
import { SyrisCard } from "../ui/syirs-card";

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

import { MealsCard } from "./meals-card";

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
    <SyrisCard
      title="Macronutrient Targets"
      action={
        <Button variant="ghost" size="icon-lg">
          <HugeiconsIcon
            icon={ArrowUp01Icon}
            strokeWidth={2}
            className="rotate-180"
          />
        </Button>
      }
      contentVariant="panel"
    >
      <ProgressBar />
      <ProgressBar />
      <ProgressBar />
      <ProgressBar />
    </SyrisCard>
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


// Breakfast: Coffee02Icon
// Lunch: Sandwich
// Dinner: SpaghettiIcon
// Snack: CookieIcon
