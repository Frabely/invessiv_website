export function coerceCount(raw: number | string | null | undefined): number {
  if (raw === null || raw === undefined) {
    return 0;
  }
  return typeof raw === "number" ? raw : Number(raw);
}

export function readAggregateCount(
  rows: ReadonlyArray<{ count: number | string | null }>,
): number {
  return coerceCount(rows[0]?.count);
}
