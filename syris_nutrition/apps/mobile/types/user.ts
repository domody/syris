import { z } from "zod";
import {
  DateSchema,
  NumericSchema,
  NullableNumericSchema,
  UuidSchema,
} from "./helpers";

export const UserGoalsSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  effective_from: DateSchema,
  kcal_target: NumericSchema,
  protein_g_target: NullableNumericSchema,
  carbs_g_target: NullableNumericSchema,
  fat_g_target: NullableNumericSchema,
});

export type UserGoals = z.infer<typeof UserGoalsSchema>;

export const UserDailyTotalsSchema = z.object({
  user_id: UuidSchema,
  date: DateSchema,
  kcal: NumericSchema,
  protein_g: NumericSchema,
  carbs_g: NumericSchema,
  fat_g: NumericSchema,
  sugars_g: NumericSchema,
  fiber_g: NumericSchema,
  salt_g: NumericSchema,
});

export type UserDailyTotals = z.infer<typeof UserDailyTotalsSchema>;
