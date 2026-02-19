import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  MealSchema,
  MealItemSchema,
  MealItemSnapshotSchema,
  MealItemPortionSchema,
  MealItemBaseSchema,
  type MealType,
} from "@/types/meals";

// zod shape to normalize supabase's nested joins

const MealItemWithRelsRawSchema = MealItemSchema.extend({
  meal_item_snapshots: z
    .preprocess((v) => {
      if (v == null) return [];
      return Array.isArray(v) ? v : [v];
    }, z.array(MealItemSnapshotSchema))
    .default([]),

  meal_item_portions: z
    .preprocess((v) => {
      if (v == null) return [];
      return Array.isArray(v) ? v : [v];
    }, z.array(MealItemPortionSchema))
    .default([]),
});

const MealWithItemsRawSchema = MealSchema.extend({
  meal_items: z.array(MealItemWithRelsRawSchema).default([]),
});

type MealWithItemsRaw = z.infer<typeof MealWithItemsRawSchema>;

export type MealItemWithDetails = Omit<
  z.infer<typeof MealItemWithRelsRawSchema>,
  "meal_item_snapshots" | "meal_item_portions"
> & {
  snapshot: z.infer<typeof MealItemSnapshotSchema> | null;
  portion: z.infer<typeof MealItemPortionSchema> | null;
};

export type MealWithItems = Omit<MealWithItemsRaw, "meal_items"> & {
  meal_items: MealItemWithDetails[];
};

function normalizeMeal(raw: MealWithItemsRaw): MealWithItems {
  return {
    ...raw,
    meal_items: raw.meal_items.map((it) => ({
      ...it,
      snapshot: it.meal_item_snapshots?.[0] ?? null,
      portion: it.meal_item_portions?.[0] ?? null,
    })),
  };
}

// select queries

const MEAL_SELECT_BASE = `
  id, user_id, eaten_at, local_date, meal_type, note, created_at,
  meal_items (
    id, meal_id, source_type, source_ref, display_name, brand, created_at,
    meal_item_snapshots (
      meal_item_id, kcal, protein_g, carbs_g, fat_g, sugars_g, fiber_g, salt_g, data_quality, confidence, created_at
    )
  )
`;

const MEAL_SELECT_WITH_PORTIONS = `
  id, user_id, eaten_at, local_date, meal_type, note, created_at,
  meal_items (
    id, meal_id, source_type, source_ref, display_name, brand, created_at,
    meal_item_snapshots (
      meal_item_id, kcal, protein_g, carbs_g, fat_g, sugars_g, fiber_g, salt_g, data_quality, confidence, created_at
    ),
    meal_item_portions (
      meal_item_id, amount, unit, grams_equivalent, portion_label, created_at
    )
  )
`;

const MEAL_ITEM_SELECT_WITH_RELS = `
  id, meal_id, source_type, source_ref, display_name, brand, created_at,
  meal_item_snapshots (
    meal_item_id, kcal, protein_g, carbs_g, fat_g, sugars_g, fiber_g, salt_g, data_quality, confidence, created_at
  ),
  meal_item_portions (
    meal_item_id, amount, unit, grams_equivalent, portion_label, created_at
  )
`;

// fetchers

export async function getMealsDay(
  userId: string,
  localDate: string,
): Promise<MealWithItems[]> {
  const { data, error } = await supabase
    .from("meals")
    .select(MEAL_SELECT_BASE)
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .order("eaten_at", { ascending: true });

  if (error) throw error;

  const raw = MealWithItemsRawSchema.array().parse(data ?? []);
  return raw.map(normalizeMeal);
}

export async function getMealByType(
  userId: string,
  localDate: string,
  mealType: MealType,
): Promise<MealWithItems | null> {
  const { data, error } = await supabase
    .from("meals")
    .select(MEAL_SELECT_WITH_PORTIONS)
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .eq("meal_type", mealType)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = MealWithItemsRawSchema.parse(data);
  return normalizeMeal(raw);
}

export async function getMealById(
  userId: string,
  mealId: string,
): Promise<MealWithItems | null> {
  const { data, error } = await supabase
    .from("meals")
    .select(MEAL_SELECT_WITH_PORTIONS)
    .eq("user_id", userId)
    .eq("id", mealId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = MealWithItemsRawSchema.parse(data);
  return normalizeMeal(raw);
}

export async function getMealItemWithDetails(
  id: string,
): Promise<MealItemWithDetails | null> {
  const { data, error } = await supabase
    .from("meal_items")
    .select(MEAL_ITEM_SELECT_WITH_RELS)
    .eq("id", id)
    .order("created_at", {
      foreignTable: "meal_item_snapshots",
      ascending: false,
    })
    .order("created_at", {
      foreignTable: "meal_item_portions",
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = MealItemWithRelsRawSchema.parse(data);
  const { meal_item_snapshots, meal_item_portions, ...rest } = raw;

  return {
    ...rest,
    snapshot: meal_item_snapshots?.[0] ?? null,
    portion: meal_item_portions?.[0] ?? null,
  };
}

export async function getMealItemBase(meal_item_id: string) {
  const { data, error } = await supabase
    .from("meal_item_bases")
    .select("*")
    .eq("meal_item_id", meal_item_id)
    .limit(1)
    .single();

  if (error) throw error;
  return MealItemBaseSchema.parse(data);
}

// mutations

export type LogMealItemRpcParams = {
  localDate: string;
  mealType: MealType;
  eatenAtIso: string;

  sourceType: string;
  sourceRef: string;
  displayName: string;
  brand?: string | null;

  portionAmount: number;
  portionUnit: string;
  gramsEquivalent: number;
  portionLabel: string;

  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  sugars_g: number | null;
  fiber_g: number | null;
  salt_g: number | null;

  dataQuality: string;
  confidence: number;
};

export async function logMealItemRpc(params: LogMealItemRpcParams) {
    const { error, data } = await supabase.rpc("log_meal_item", {
    p_local_date: params.localDate,
    p_meal_type: params.mealType,
    p_eaten_at: params.eatenAtIso,

    p_source_type: params.sourceType,
    p_source_ref: params.sourceRef,
    p_display_name: params.displayName,
    p_brand: params.brand ?? null,

    p_portion_amount: params.portionAmount,
    p_portion_unit: params.portionUnit,
    p_grams_equivalent: params.gramsEquivalent,
    p_portion_label: params.portionLabel,

    p_kcal: params.kcal,
    p_protein_g: params.protein_g,
    p_carbs_g: params.carbs_g,
    p_fat_g: params.fat_g,
    p_sugars_g: params.sugars_g,
    p_fiber_g: params.fiber_g,
    p_salt_g: params.salt_g,

    p_data_quality: params.dataQuality,
    p_confidence: params.confidence,
  });

  if (error) throw error;
  return data;
}

export async function updateMealItemGramsRpc(meal_item_id: string, grams: number) {
    const { error, data } = await supabase.rpc("update_meal_item_grams", {
    p_meal_item_id: meal_item_id,
    p_grams: grams,
  });

  if (error) throw error;
  return data;
}