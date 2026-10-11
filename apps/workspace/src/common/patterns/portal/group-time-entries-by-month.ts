/**
 * Splits a list that is already sorted newest first into runs of one calendar month (`YYYY-MM`).
 * The order is kept as given, so pages loaded later simply continue the last group.
 */
export function groupTimeEntriesByMonth<TEntry extends { performedOn: string }>(
  entries: readonly TEntry[],
): { month: string; entries: TEntry[] }[] {
  const groups: { month: string; entries: TEntry[] }[] = [];
  for (const entry of entries) {
    const month = entry.performedOn.slice(0, 7);
    const last = groups.at(-1);
    if (last?.month === month) last.entries.push(entry);
    else groups.push({ month, entries: [entry] });
  }
  return groups;
}
