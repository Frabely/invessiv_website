const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether a value is a real calendar day written as `YYYY-MM-DD`. The shape alone is not enough:
 * `2026-02-30` matches it but names no day, so the parsed date has to give the same text back.
 */
export function isIsoCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  );
}
