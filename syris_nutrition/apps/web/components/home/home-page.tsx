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
import { MacronutrientTargetCard } from "./totals-card";
import { Notice } from "../notice/notice";

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
        <Notice />
        <MacronutrientTargetCard />
        <MealsCard />
      </div>
    </div>
  );
}





// Breakfast: Coffee02Icon
// Lunch: Sandwich
// Dinner: SpaghettiIcon
// Snack: CookieIcon
