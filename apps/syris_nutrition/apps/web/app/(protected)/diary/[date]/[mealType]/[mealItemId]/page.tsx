import { BackButton } from "@/components/nav/back-button";
import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { Button } from "@/components/ui/button";
import { PageWrap } from "@/components/ui/page-wrap";
import { getMealItemBase, getMealItemWithDetails } from "@/lib/data/meals.server";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { redirect } from "next/navigation";
import { getEffectiveGoals } from "@/lib/data/goals";
import { ItemEditors } from "./client";

export default async function Page({
  params,
}: {
  params: Promise<{ date: string; mealType: string; mealItemId: string }>;
}) {
  const { date, mealItemId } = await params;

  const mealItem = await getMealItemWithDetails(mealItemId);
  if (!mealItem) redirect("/");

  const goals = await getEffectiveGoals(date);
  const base = await getMealItemBase(mealItemId)

  return (
    <PageWrap>
      <TopBar className="flex items-center justify-between gap-2">
        <BackButton />
        <p className="text-sm text-muted-foreground">Edit Entry</p>
        <Button variant={"ghost"} size={"icon-lg"}>
          <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />
        </Button>
      </TopBar>
      <div className="flex flex-col items-start justify-start w-full gap-y-4">
        <p className="font-medium text-lg">{mealItem.display_name}</p>
        {mealItem.portion && mealItem.snapshot && goals && (
          <ItemEditors
            meal_item_id={mealItem.id}
            portion={mealItem.portion}
            snapshot={mealItem.snapshot}
            base={base}
            goals={goals}
          />
        )}
      </div>
    </PageWrap>
  );
}
