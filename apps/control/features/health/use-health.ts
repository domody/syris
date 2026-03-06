import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "./health-api";
import { healthKeys } from "./health-keys";

const FIVE_MIN = 5 * 60 * 1000;

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: fetchHealth,

    refetchInterval: FIVE_MIN,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,

    staleTime: 0,
    retry: 0,
  });
}
