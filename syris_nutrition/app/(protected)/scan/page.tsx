import { fetchProductLite } from "@/utils/product";

export default async function Page() {
  const barcode = 5060517885137;

  const product = await fetchProductLite(barcode)
  
  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>
      {JSON.stringify(product, null, 2)}
    </pre>
  );
}
