/** "2025-07" -> "JUL 2025"; "2018" -> "2018" (year-only stays year-only). */
export function formatDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  const [y, m] = value.split("-");
  const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
  return `${month.toUpperCase()} ${y}`;
}

/** No end date reads as "PRESENT". */
export function formatRange(start: string, end?: string): string {
  return `${formatDate(start)} — ${end ? formatDate(end) : "PRESENT"}`;
}
