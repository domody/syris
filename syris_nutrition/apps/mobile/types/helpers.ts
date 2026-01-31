import {z} from "zod";

export const UuidSchema = z.string().uuid();
export const DateSchema = z.string(); // "YYYY-MM-DD"
export const TimestampSchema = z.string(); // ISO timestamptz string

// Accept numeric coming back as number OR string, optionally coercing to number.
export const NumericSchema = z.union([z.number(), z.string()]).transform((v) =>
  typeof v === "string" ? Number(v) : v
);

// Same as NumericSchema but allows null (for nullable numeric columns)
export const NullableNumericSchema = z
  .union([z.number(), z.string(), z.null()])
  .transform((v) => (v === null ? null : typeof v === "string" ? Number(v) : v));