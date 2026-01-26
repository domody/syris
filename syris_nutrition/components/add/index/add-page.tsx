"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SyrisCard } from "@/components/ui/syirs-card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Cancel01Icon,
  FilterMailSquareIcon,
  MoreHorizontalCircle02Icon,
} from "@hugeicons/core-free-icons";

import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { PageWrap } from "@/components/ui/page-wrap";
import { addMap } from "../add-map";

import type { ProductLite } from "@/types/product";
import { MealsClient, MEAL_TYPES, type MealType } from "@/lib/data/meals.client";
import { MealTypeSchema } from "@/types/meals";

// (Optional) dev-only seed item
const testItem: ProductLite = {
  gtin: 5060517885137,
  name: "Monster Mango Loco",
  brand: "Monster",
  image_url: "https://images.openfoodfacts.net/images/products/506/051/788/5137/front_en.16.400.jpg",
  serving_amount: "500",
  serving_unit: "g",
  serving_label: "1 can (500 g)",
  nutrients_per_100: {
    caffeine: 0.032,
    carbohydrates: 12,
    "energy-kcal": 47.8,
    energy: 200,
    fat: 0,
    proteins: 0,
    salt: 0.12,
    sodium: 0.048,
    sugars: 11.2,
  },
  nutrients_per_serving: {
    caffeine: 0.16,
    carbohydrates: 60,
    "energy-kcal": 239,
    energy: 1000,
    fat: 0,
    proteins: 0,
    salt: 0.6,
    sodium: 0.24,
    sugars: 56,
  },
  nutrients_units: {
    caffeine: "g",
    carbohydrates: "g",
    "energy-kcal": "kcal",
    energy: "kcal",
    fat: "g",
    proteins: "g",
    salt: "g",
    sodium: "g",
    sugars: "g",
  },
};

const sortedAddMap = [...addMap].sort(
  (a, b) => Number(a.disabled || 0) - Number(b.disabled || 0),
);

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return "Something went wrong.";
  }
}

export function AddPage() {
  const searchParams = useSearchParams();
  let prefillType = searchParams.get("prefillType")

  if (!MealTypeSchema.safeParse(prefillType).success) {
    prefillType = null;
  }

  const mealsClient = React.useMemo(() => new MealsClient(), []);
  const [selectedItems, setSelectedItems] = React.useState<ProductLite[]>([testItem]);

  console.log(prefillType)
  const [mealType, setMealType] = React.useState<MealType | null>(prefillType as MealType);

  return (
    <PageWrap className="px-0 relative">
      <TopBar className="px-4">
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href="/">
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Link>
        </Button>

        <MealTypeSelect value={mealType} onValueChange={setMealType} />

        <Button variant="ghost" size="icon-lg">
          <HugeiconsIcon icon={MoreHorizontalCircle02Icon} strokeWidth={2} />
        </Button>
      </TopBar>

      <div className="grid grid-cols-1 w-full border-t">
        {sortedAddMap.map((option) => (
          <Link
            key={option.link}
            href={option.link}
            className={[
              "col-span-1 w-full rounded-md flex items-center justify-start gap-y-2 [&>svg]:size-4.5 gap-4 px-4 py-2 border-b",
              option.disabled ? "text-muted-foreground pointer-events-none" : "text-primary",
            ].join(" ")}
            aria-disabled={option.disabled}
          >
            <HugeiconsIcon icon={option.icon} strokeWidth={2} />
            <p className="text-base text-center">{option.label}</p>
          </Link>
        ))}
      </div>

      <SyrisCard
        className="px-4 mt-4"
        title="History"
        action={
          <Button variant="outline">
            <HugeiconsIcon icon={FilterMailSquareIcon} strokeWidth={2} />
            Filter
          </Button>
        }
        contentVariant="list"
      >
        <HistoryItem />
        <HistoryItem />
        {/* ... */}
      </SyrisCard>

      <ConfirmSelection
        mealsClient={mealsClient}
        selectedItems={selectedItems}
        mealType={mealType}
        grams={250}
        // Example future hooks:
        // onSuccess={() => setSelectedItems([])}
      />
    </PageWrap>
  );
}

function ConfirmSelection({
  mealsClient,
  selectedItems,
  mealType,
  grams,
}: {
  mealsClient: MealsClient;
  selectedItems: ProductLite[];
  mealType: MealType | null;
  grams: number;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const itemsSelected = selectedItems.length > 0;
  const mealSelected = mealType !== null;
  const canSubmit = itemsSelected && mealSelected && !isSubmitting;

  async function onAddToDiary() {
    if (!canSubmit || !mealType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await mealsClient.logMealItems({
        items: selectedItems,
        mealType,
        grams,
      });

      // setSelectedItems([]);
      router.replace("/")
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-screen py-4 border-t fixed left-0 bottom-0 gap-4 grid grid-cols-2 px-4 bg-background">
      <Button
        variant="secondary"
        size="lg"
        disabled={!itemsSelected || !mealSelected || isSubmitting}
      >
        Review {selectedItems.length} Item{selectedItems.length !== 1 ? "s" : ""}
      </Button>

      <Button size="lg" disabled={!canSubmit} onClick={onAddToDiary}>
        {isSubmitting ? "Adding..." : "Add to Diary"}
      </Button>

      {error ? (
        <p className="col-span-2 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function MealTypeSelect({
  value,
  onValueChange,
}: {
  value: MealType | null;
  onValueChange: (value: MealType | null) => void;
}) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        if (MEAL_TYPES.includes(v as MealType)) onValueChange(v as MealType);
        else onValueChange(null);
      }}
    >
      <SelectTrigger
        id="select-meal-type"
        className="bg-transparent dark:bg-transparent border-0 text-base text-primary font-semibold focus-visible:ring-0"
      >
        <SelectValue placeholder="Select a Meal" />
      </SelectTrigger>

      <SelectContent position="popper" align="center">
        <SelectGroup>
          <SelectItem value="breakfast">Breakfast</SelectItem>
          <SelectItem value="lunch">Lunch</SelectItem>
          <SelectItem value="dinner">Dinner</SelectItem>
          <SelectItem value="snack">Snack</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function HistoryItem() {
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>Greek Yogurt</ItemTitle>
        <ItemDescription>420 kcals | 250g</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="secondary" className="text-primary">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      </ItemActions>
    </Item>
  );
}
