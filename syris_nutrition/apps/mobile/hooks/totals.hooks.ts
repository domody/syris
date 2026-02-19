import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { getDailyTotals } from "@/api/totals.api";
import { useAuth } from "@/providers/auth-provider";

export function useDailyTotals(localDate: string) {
    const { user, loading } = useAuth()

    return useQuery({
        queryKey: user?.id
        ? qk.totals.day(user.id, localDate)
        : ["totals", "no-user", localDate],
        queryFn: () => getDailyTotals(user!.id, localDate),
        enabled: !loading && !!user?.id && !!localDate,
        staleTime: 5_000, // totals are already invalidated by mutations, so stale time can be modest
    })
}