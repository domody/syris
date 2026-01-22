import { z } from "zod";

import { Button } from "@/components/ui/button";
import { SyrisCard } from "../ui/syirs-card";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon } from "@hugeicons/core-free-icons";

import { createClient } from "@/utils/supabase/server";
import { todayDate } from "@/utils/date";

type MacroSummaryVM = {
  date: string;
  goals: { kcal: number; protein: number; carbs: number; fat: number };
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  remaining: { kcal: number; protein: number; carbs: number; fat: number };
};

function n(x: unknown): number {
  // Supabase numeric often returns string
  if (x == null) return 0;
  const v = typeof x === "string" ? Number(x) : (x as number);
  return Number.isFinite(v) ? v : 0;
}

const macroMeta = {
  kcal: {
    label: "Energy",
    unit: "kcal",
    trackClass: "bg-amber-500/30",
    fillClass: "bg-amber-500",
  },
  protein: {
    label: "Protein",
    unit: "g",
    trackClass: "bg-blue-500/30",
    fillClass: "bg-blue-500",
  },
  carbs: {
    label: "Carbs",
    unit: "g",
    trackClass: "bg-violet-500/30",
    fillClass: "bg-violet-500",
  },
  fat: {
    label: "Fat",
    unit: "g",
    trackClass: "bg-emerald-500/30",
    fillClass: "bg-emerald-500",
  },
};

export async function MacronutrientTargetCard() {
  const date = todayDate()
  const supabase = await createClient();

  const { data: goalsRow, error: goalsErr } = await supabase
    .from("daily_goals")
    .select(
      "effective_from,kcal_target,protein_g_target,carbs_g_target,fat_g_target",
    )
    .lte("effective_from", date)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: totalsRow, error: totalsErr } = await supabase
    .from("daily_totals")
    .select("date,kcal,protein_g,carbs_g,fat_g")
    .eq("date", date)
    .maybeSingle();

  const goals = {
    kcal: n(goalsRow?.kcal_target),
    protein: n(goalsRow?.protein_g_target),
    carbs: n(goalsRow?.carbs_g_target),
    fat: n(goalsRow?.fat_g_target),
  };

  const totals = {
    kcal: n(totalsRow?.kcal),
    protein: n(totalsRow?.protein_g),
    carbs: n(totalsRow?.carbs_g),
    fat: n(totalsRow?.fat_g),
  };

  const remaining = {
    kcal: Math.max(0, goals.kcal - totals.kcal),
    protein: Math.max(0, goals.protein - totals.protein),
    carbs: Math.max(0, goals.carbs - totals.carbs),
    fat: Math.max(0, goals.fat - totals.fat),
  };

  const vm: MacroSummaryVM = { date, goals, totals, remaining };

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
      {Object.entries(vm.goals).map(([key, goal]) => {
        const current = vm.totals[key];
        const meta = macroMeta[key] ?? { label: key, unit: "", track: "", fill: "" };

        return (
          <ProgressBar
            key={key}
            macro={meta.label}
            current={current}
            goal={goal}
            unit={meta.unit}
            track={meta.trackClass}
            fill = {meta.fillClass}
          />
        );
      })}
    </SyrisCard>
  );
}

function ProgressBar({
  macro,
  current,
  goal,
  unit,
  track,
  fill
}: {
  macro: string;
  current: number;
  goal: number;
  unit: string;
  track: string;
  fill: string;
}) {
  const percent = goal > 0 ? Math.round((current / goal) * 100) : 0;

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
      <div className={`w-full h-2 relative overflow-hidden rounded-full ${track}`}>
        <div
          className={`h-full absolute top-0 left-0 ${fill}`}
          style={{ width: `${percent > 100 ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}
