import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { getOffProductLite } from "@/api/open-food-facts.api";

export function useOffProduct(barcode: string | number) {
  const keyBarcode = String(barcode ?? "").trim();

  return useQuery({
    queryKey: qk.off.product(keyBarcode),
    queryFn: ({ signal }) => getOffProductLite(keyBarcode, { signal }),
    enabled: /^\d{8,14}$/.test(keyBarcode),

    // off is fairly stable, so scanning should feel instant if seen before
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7d
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30d

    retry: 1,
  });
}
