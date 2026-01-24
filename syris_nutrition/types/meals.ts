import { z } from "zod";
import {
  UuidSchema,
  TimestampSchema,
  DateSchema,
  NumericSchema,
  NullableNumericSchema,
} from "./helpers";

// Meal Enums
export const MealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type MealType = z.infer<typeof MealTypeSchema>;
export const SourceTypeSchema = z.enum([
  "off_barcode",
  "recipe",
  "recipe_batch",
  "custom_food",
  "quick_add",
  "estimated_text",
]);

export const DataQualitySchema = z.enum([
  "label_based",
  "database",
  "manual",
  "estimated",
]);

export const PortionUnitSchema = z.enum(["g", "ml", "piece", "serving"]);
export type PortionUnit = z.infer<typeof PortionUnitSchema>;

export const PortionBasisSchema = z.enum([
  "per_serving",
  "per_100g",
  "per_100ml",
]);

// Schemas
export const MealSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  eaten_at: TimestampSchema,
  local_date: DateSchema,
  meal_type: MealTypeSchema,
  note: z.string().nullable().optional(), // nullable text
  created_at: TimestampSchema, // NOT NULL timestamptz default now()
});
export type Meal = z.infer<typeof MealSchema>;

export const MealItemSchema = z.object({
  id: UuidSchema,
  meal_id: UuidSchema, // NOT NULL FK
  source_type: SourceTypeSchema, // NOT NULL enum
  source_ref: z.string().nullable().optional(), // nullable text
  display_name: z.string(), // NOT NULL
  brand: z.string().nullable().optional(), // nullable text
  created_at: TimestampSchema, // NOT NULL
});
export type MealItem = z.infer<typeof MealItemSchema>;

export const MealItemSnapshotSchema = z.object({
  meal_item_id: UuidSchema, // PK/FK -> meal_items.id
  kcal: NumericSchema, // numeric NOT NULL
  protein_g: NullableNumericSchema.optional(), // numeric nullable
  carbs_g: NullableNumericSchema.optional(), // numeric nullable
  fat_g: NullableNumericSchema.optional(), // numeric nullable
  sugars_g: NullableNumericSchema.optional(), // numeric nullable
  fiber_g: NullableNumericSchema.optional(), // numeric nullable
  salt_g: NullableNumericSchema.optional(), // numeric nullable
  data_quality: DataQualitySchema, // enum NOT NULL
  confidence: NumericSchema,
  created_at: TimestampSchema,
});
// .refine((n) => n >= 0 && n <= 1, {
//     message: "confidence must be between 0 and 1",
//   })
export type MealItemSnapshot = z.infer<typeof MealItemSnapshotSchema>;

export const MealItemAssumptionSchema = z.object({
  id: UuidSchema, // uuid
  meal_item_id: UuidSchema, // uuid (FK -> public.meal_items.id)
  assumption: z.string(),
});
export type MealItemAssumption = z.infer<typeof MealItemAssumptionSchema>;

export const MealItemPortionSchema = z.object({
  meal_item_id: UuidSchema, // uuid (PK/FK -> public.meal_items.id)
  amount: NumericSchema, // numeric
  unit: PortionUnitSchema, // portion_unit
  grams_equivalent: NullableNumericSchema, // numeric nullable
  portion_label: z.string().nullable(), // text nullable
  created_at: TimestampSchema, // timestamptz
});
export type MealItemPortion = z.infer<typeof MealItemPortionSchema>;

export const MealItemBaseSchema = z.object({
  meal_item_id: UuidSchema, // uuid (PK/FK -> public.meal_items.id)
  basis: PortionBasisSchema,
  serving_grams: NullableNumericSchema,
  kcal: z.number(),
  protein_g: NullableNumericSchema,
  carbs_g: NullableNumericSchema,
  fat_g: NullableNumericSchema,
  sugars_g: NullableNumericSchema,
  fiber_g: NullableNumericSchema,
  salt_g: NullableNumericSchema,
});
export type MealItemBase = z.infer<typeof MealItemBaseSchema>;
