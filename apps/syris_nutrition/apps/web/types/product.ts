import { z } from "zod";

const ProductLiteSchema = z.object({
  gtin: z.coerce.number(),
  name: z.string(),
  brand: z.string(),
  image_url: z.string(),
  serving_amount: z.union([z.string(), z.number()]),
  serving_unit: z.string(),
  serving_label: z.string(),
  nutrients_per_100: z.record(z.string(), z.number()),
  nutrients_per_serving: z.record(z.string(), z.number()),
  nutrients_units: z.record(z.string(), z.string())
});

export type ProductLite = z.infer<typeof ProductLiteSchema>;