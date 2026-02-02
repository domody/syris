import { supabase } from "@/lib/supabase";
import { UserDailyTotals, UserDailyTotalsSchema } from "@/types/user";

export async function getDailyTotals(userId: string, localDate: string): Promise<UserDailyTotals | null> {
  const { data, error } = await supabase
    .from("daily_totals")
    .select()
    .eq("user_id", userId)
    .eq("date", localDate)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return UserDailyTotalsSchema.parse(data);
}
