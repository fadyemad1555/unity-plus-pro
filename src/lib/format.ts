// Egyptian Pound formatter — used everywhere prices are displayed.
export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!isFinite(n)) return "ج.م 0.00";
  const formatted = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `ج.م ${formatted}`;
}

export const CURRENCY = "ج.م";
