/**
 * Immutable helpers for lists sorted with up/down buttons. An index outside the list, or a move
 * past either end, returns an unchanged copy instead of throwing, so a double click stays harmless.
 */
export function moveListItem<T>(
  items: readonly T[],
  index: number,
  direction: -1 | 1,
): T[] {
  const next = [...items];
  const target = index + direction;
  if (!(index in next) || !(target in next)) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function removeListItem<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, position) => position !== index);
}

/** Inserts before `index`; an index at or past the end appends. */
export function insertListItem<T>(
  items: readonly T[],
  index: number,
  item: T,
): T[] {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}
