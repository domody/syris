import {
  Apple01Icon,
  BarcodeScanIcon,
  ChefHatIcon,
  AiBrain05Icon,
  MealScanIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";

export const addMap = [
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