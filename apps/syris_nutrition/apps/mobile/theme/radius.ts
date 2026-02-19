export const makeRadius = (base: number) => ({
  sm: Math.max(0, base - 4),
  md: Math.max(0, base - 2),
  lg: base,
  xl: base + 4,
  "2xl": base + 8,
  "3xl": base + 12,
  "4xl": base + 16,
});