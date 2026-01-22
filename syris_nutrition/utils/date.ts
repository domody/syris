const pad2 = (n: number) => String(n).padStart(2, "0");
const pad3 = (n: number) => String(n).padStart(3, "0");
const pad6 = (n: number) => String(n).padStart(6, "0");

/**
 * Formats a Date as:
 *   YYYY-MM-DD
 * in UTC.
 */
export function formatDateOnly(date: Date = new Date()): string {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid Date");

  const y = date.getUTCFullYear();
  const m = pad2(date.getUTCMonth() + 1);
  const d = pad2(date.getUTCDate());
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date as YYYY-MM-DD (UTC).
 */
export function todayDate(): string {
  return formatDateOnly(new Date());
}
