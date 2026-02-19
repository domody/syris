import { supabase } from "@/lib/supabase";
import { UserGoalsSchema, UserGoals } from "@/types/user";

export async function getEffectiveGoals(
  userId: string,
  localDate: string,
): Promise<UserGoals | null> {
  const { data, error } = await supabase
    .from("daily_goals")
    .select(
      "id,user_id,effective_from,kcal_target,protein_g_target,carbs_g_target,fat_g_target",
    )
    .lte("effective_from", localDate)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return UserGoalsSchema.parse(data);
}
