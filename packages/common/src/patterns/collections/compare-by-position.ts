/** Comparator for `sort` on anything with a `position`; sorts ascending. */
export function compareByPosition(
  left: { position: number },
  right: { position: number },
): number {
  return left.position - right.position;
}
