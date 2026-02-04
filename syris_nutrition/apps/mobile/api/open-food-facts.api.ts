import { number, z } from "zod";
import { ProductLite } from "@/types/product";

const OFF_BASE_URL = "https://world.openfoodfacts.net";

const OffProductSchema = z.object({
  code: z.string().optional(),
  product_name: z.string().optional().nullable(),
  product_name_en: z.string().optional().nullable(),
  brands: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  image_front_url: z.string().optional().nullable(),
  serving_size: z.string().optional().nullable(),
  serving_quantity: z.union([z.number(), z.string()]).optional().nullable(),
  serving_quantity_unit: z.string().optional().nullable(),
  nutriments: z.record(z.string(), z.any()).optional().nullable(),
});

const OffEnvelopeSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  status: z.number().optional(), // 1 found, 0 not found
  status_verbose: z.string().optional(),
  product: OffProductSchema.optional().nullable(),
});

type Nutriments = Record<string, unknown>;

function parseServingFallback(servingSize: string | null | undefined): {
  amount: string | number;
  unit: string;
} {
  // try search for (e.g.) 30g or 30 g
  if (!servingSize) return { amount: "", unit: "" };
  const m = String(servingSize)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\b/);
  if (!m) return { amount: "", unit: "" };
  return { amount: m[1], unit: m[2] };
}

function extractNutrientsWithUnits(
  nutriments: Nutriments | null | undefined,
  suffix: "_100g" | "_serving",
  opts?: { normalizeMgToG?: boolean },
): { values: Record<string, number>; units: Record<string, string> } {
  const values: Record<string, number> = {};
  const units: Record<string, string> = {};
  if (!nutriments) return { values, units };

  const normalizeMgToG = opts?.normalizeMgToG ?? true;

  for (const [key, rawValue] of Object.entries(nutriments)) {
    if (!key.endsWith(suffix)) continue;
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) continue;

    const baseKey = key.slice(0, -suffix.length);
    const unitKey = `${baseKey}_unit`;
    const unitRaw = nutriments[unitKey];
    const unit = typeof unitRaw === "string" ? unitRaw : undefined;

    let value = rawValue;
    let outUnit = unit;

    if (normalizeMgToG && unit === "mg") {
      value = rawValue / 1000;
      outUnit = "g";
    }

    values[baseKey] = value;
    if (outUnit) units[baseKey] = outUnit;
  }

  return { values, units };
}

function toProductLiteFromOff(
  barcode: string,
  off: z.infer<typeof OffProductSchema>,
): ProductLite {
  const name = (off.product_name_en ?? off.product_name ?? "").trim();
  const brand = (off.brands ?? "").trim();

  const image_url = String(off.image_url ?? off.image_front_url ?? "");

  let serving_amount: string | number = off.serving_quantity ?? "";
  let serving_unit = String(off.serving_quantity_unit ?? "");
  if (!serving_amount || !serving_unit) {
    const parsed = parseServingFallback(off.serving_size);
    serving_amount = serving_amount || parsed.amount;
    serving_unit = serving_unit || parsed.unit;
  }

  const serving_label = String(off.serving_size ?? "");

  const per100 = extractNutrientsWithUnits(
    off.nutriments ?? undefined,
    "_100g",
    {
      normalizeMgToG: true,
    },
  );

  const perServing = extractNutrientsWithUnits(
    off.nutriments ?? undefined,
    "_serving",
    {
      normalizeMgToG: true,
    },
  );

  const mergedUnits = { ...per100.units, ...perServing.units };

  return {
    gtin: Number(barcode),
    name,
    brand,
    image_url,

    serving_amount,
    serving_unit,
    serving_label,

    nutrients_per_100: per100.values,
    nutrients_per_serving: perServing.values,
    nutrients_units: mergedUnits,
  };
}

export async function getOffProductLite(
  barcodeInput: string | number,
  opts?: { signal?: AbortSignal },
): Promise<ProductLite | null> {
  const barcode = String(barcodeInput).trim();

  // basic sanity: only digits (OFF is GTIN/barcode)
  if (!/^\d{8,14}$/.test(barcode)) return null;

  // Use fields= to reduce payload on mobile
  const fields = [
    "product_name",
    "product_name_en",
    "brands",
    "image_url",
    "image_front_url",
    "serving_size",
    "serving_quantity",
    "serving_quantity_unit",
    "nutriments",
  ].join(",");

  const url = `${OFF_BASE_URL}/api/v2/product/${barcode}?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, { method: "GET", signal: opts?.signal });
  if (!res.ok) {
    throw new Error(`OFF request failed (${res.status})`);
  }

  const json = await res.json();
  const env = OffEnvelopeSchema.parse(json);

  if (!env.product || env.status == 0) return null;

  return toProductLiteFromOff(barcode, env.product);
}
