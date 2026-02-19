import { offFetchJson } from "../lib/off";
import { ProductLite } from "@/types/product";

type Nutriments = Record<string, unknown>;

function extractNutrientsWithUnits(
  nutriments: Nutriments | undefined,
  suffix: "_100g" | "_serving",
  opts?: {
    normalizeMgToG?: boolean;
  },
): { values: Record<string, number>; units: Record<string, string> } {
  const values: Record<string, number> = {};
  const units: Record<string, string> = {};

  if (!nutriments) return { values, units };

  const normalize = opts?.normalizeMgToG ?? false;

  for (const [key, rawValue] of Object.entries(nutriments)) {
    if (!key.endsWith(suffix)) continue;
    if (typeof rawValue !== "number" || Number.isNaN(rawValue)) continue;

    const baseKey = key.slice(0, -suffix.length);
    const unitKey = `${baseKey}_unit`;
    const unitRaw = nutriments[unitKey];
    const unit = typeof unitRaw === "string" ? unitRaw : undefined;

    let value = rawValue;

    if (normalize && unit === "mg") {
      value = value / 1000;
      units[baseKey] = "g";
    } else if (unit) {
      units[baseKey] = unit;
    }

    values[baseKey] = value;
  }

  return { values, units };
}

export function toProductLite(data: any): ProductLite {
  const p = data.product;

  const per100 = extractNutrientsWithUnits(p?.nutriments, "_100g", {
    normalizeMgToG: false, // keep original units; flip to true if you prefer grams
  });

  const perServing = extractNutrientsWithUnits(p?.nutriments, "_serving", {
    normalizeMgToG: false,
  });

  // Merge units from both (same base keys; this makes it resilient if one side is missing)
  const mergedUnits = { ...per100.units, ...perServing.units };

  return {
    gtin: Number(p?.code ?? 0),
    name: String(p?.product_name_en ?? p?.product_name ?? ""),
    brand: String(p?.brands ?? ""),
    image_url: String(p?.image_url ?? p?.image_front_url ?? ""),

    serving_amount: p?.serving_quantity ?? "",
    serving_unit: String(p?.serving_quantity_unit ?? ""),
    serving_label: String(p?.serving_size ?? ""),

    nutrients_per_100: per100.values,
    nutrients_per_serving: perServing.values,
    nutrients_units: mergedUnits,
  };
}

export async function fetchProductLite(barcode: number): Promise<ProductLite>  {

    const data = await offFetchJson(`/api/v2/product/${barcode}`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  const product = toProductLite(data)

  return product
}

