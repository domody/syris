import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { getEffectiveGoals } from "@/api/goals.api";
import { useAuth } from "@/providers/auth-provider";

export function useEffectiveGoals(localDate: string) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: user?.id
      ? qk.goals.effective(user.id, localDate)
      : ["goals", "no-user", "effective", localDate],
    queryFn: () => getEffectiveGoals(user!.id, localDate),
    enabled: !loading && !!user?.id && !!localDate,
    staleTime: 1000 * 60 * 10, // goals change rarely, we can keep them around longer. approx 10m
  });
}
