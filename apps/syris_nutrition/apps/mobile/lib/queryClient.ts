import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // no browser focus semantics on RN so must declare
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,

        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

        // avoid instantly refetching when navigating back
        staleTime: 15_000,
        
        // cache for 10m to make back/forward nav snappier
        gcTime: 1000 * 60 * 10,
      },
      mutations: {
        retry: 0, // handle errors explicitly
      },
    },
  });
}
