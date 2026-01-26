import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { PageWrap } from "@/components/ui/page-wrap";
import { MealType } from "@/types/meals";
import { getMealWithItemsFromType } from "@/lib/data/meals.server";
import { buildDiaryVM } from "@/lib/vm/diaryMeal";
import { SyrisCard } from "@/components/ui/syirs-card";
import {
  Item,
  ItemHeader,
  ItemDescription,
  ItemContent,
  ItemActions,
  ItemTitle,
} from "@/components/ui/item";
import { CaloriesRadialChart } from "@/components/data/calories-radial";
import { getEffectiveGoals } from "@/lib/data/goals";
import { MacronutrientProgress } from "@/components/data/macros-progress";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { BackButton } from "@/components/nav/back-button";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ date: string; mealType: string }>;
}) {
  const { date, mealType } = await params;

  const meal = await getMealWithItemsFromType(date, mealType as MealType);
  if (meal == null) redirect("/");
  const vm = buildDiaryVM([meal])[0];

  const goals = await getEffectiveGoals(date);

  return (
    <PageWrap>
      <TopBar className="flex items-center justify-between gap-2">
        <BackButton />
        <p className="text-sm text-muted-foreground">{date}</p>
      </TopBar>
      <div className="flex flex-col items-start justify-start w-full gap-y-4">
        <p className="font-medium text-lg">{vm.label}</p>
        <SyrisCard title={"Energy Summary"} contentVariant="panel">
          <div className="w-full grid grid-cols-2 gap-2">
            <CaloriesRadialChart
              chartData={[
                {
                  protein: vm.macroInfo.p.value * 4,
                  carbs: vm.macroInfo.c.value * 4,
                  fats: vm.macroInfo.f.value * 9,
                },
              ]}
            />
            <div className="flex items-start justify-center flex-col gap-2">
              <p>
                <span className="text-chart-1 font-semibold">Protein</span> -{" "}
                {vm.macroInfo.p.value}g
              </p>
              <p>
                <span className="text-chart-2 font-semibold">Carbs</span> -{" "}
                {vm.macroInfo.c.value}g
              </p>
              <p>
                <span className="text-chart-3 font-semibold">Fat</span> -{" "}
                {vm.macroInfo.f.value}g
              </p>
            </div>
          </div>
        </SyrisCard>
        <SyrisCard title={"Macronutreint Targets"} contentVariant="panel">
          <MacronutrientProgress
            macro={"kcal"}
            value={
              vm.macroInfo.p.value * 4 +
              vm.macroInfo.c.value * 4 +
              vm.macroInfo.f.value * 9
            }
            target={goals?.kcal_target}
          />
          <MacronutrientProgress
            macro={"protein"}
            value={vm.macroInfo.p.value}
            target={goals?.protein_g_target}
          />
          <MacronutrientProgress
            macro={"carbs"}
            value={vm.macroInfo.c.value}
            target={goals?.carbs_g_target}
          />
          <MacronutrientProgress
            macro={"fat"}
            value={vm.macroInfo.f.value}
            target={goals?.fat_g_target}
          />
        </SyrisCard>
        <SyrisCard title={"Meal Items"} contentVariant={"list"}>
          {meal.meal_items.map((item) => {
            const snapshot = item.snapshot!;
            const portion = item.portion!;
            return (
              <Item key={item.id} variant={"muted"} asChild>
                <Link href={`/diary/${date}/${mealType}/${item.id}`}>
                  <ItemContent>
                    <ItemTitle>{item.display_name}</ItemTitle>
                    <ItemDescription>{portion.portion_label}</ItemDescription>
                    <ItemDescription>{snapshot.kcal} kcal</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <HugeiconsIcon
                      className="size-4"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                    />
                  </ItemActions>
                </Link>
              </Item>
            );
          })}
        </SyrisCard>
      </div>
    </PageWrap>
  );
}
