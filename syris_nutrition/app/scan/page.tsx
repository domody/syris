import { offFetchJson } from "@/lib/off";
import { ProductLite } from "@/types/product";
import { toProductLite } from "@/lib/product";

export default async function Page() {
  const barcode = 5060517885137;

  const data = await offFetchJson(`/api/v2/product/${barcode}`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  const product = toProductLite(data)

  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>
      {JSON.stringify(product, null, 2)}
    </pre>
  );
}
