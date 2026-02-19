export function asNum(n: unknown): number {
  // Supabase numeric often comes back as string
  if (n == null) return 0;
  const x = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(x) ? x : 0;
}
