import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Apple01Icon,
  BarcodeScanIcon,
  ChefHatIcon,
  AiBrain05Icon,
  MealScanIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";

const addMap = [
  {
    label: "Add Food",
    link: "/add/search",
    icon: Apple01Icon,
  },
  {
    label: "Scan Barcode",
    link: "/scan/barcode",
    icon: BarcodeScanIcon,
  },
  {
    label: "Recipe",
    link: "/add/recipe",
    icon: ChefHatIcon,
  },
  {
    label: "Ask SYRIS",
    link: "/syris-estimate",
    icon: AiBrain05Icon,
    disabled: true,
  },
  {
    label: "Scan Meal",
    link: "/scan/meal",
    icon: MealScanIcon,
    disabled: true,
  },
  {
    label: "Add Manually",
    link: "/add/manual",
    icon: PencilEdit02Icon,
  },
];

export function AddButtonMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="-translate-y-1/2">
        <div
          className={`flex flex-col h-12 aspect-square rounded-full items-center justify-center gap-1 [&_svg:not([class*='size-'])]:size-5 bg-primary  text-primary-foreground`}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          {addMap.map((option) => {
            return (
              <DropdownMenuItem className="text-base [&_svg:not([class*='size-'])]:size-4.5" key={option.label} asChild disabled={option.disabled}>
                <Link href={option.link}>
                  <HugeiconsIcon icon={option.icon} strokeWidth={2} />
                  <span>{option.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
