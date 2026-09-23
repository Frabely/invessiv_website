export type ListSearchParamsInput = Record<
  string,
  string | string[] | undefined
>;

/** A repeated param (an array) is treated as absent; list filters take exactly one value. */
export function readListSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function readListPage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}
