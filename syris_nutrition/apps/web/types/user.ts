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
