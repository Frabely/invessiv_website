/** Same length and the same values in the same order; the order is part of the meaning. */
export function sameSequence<T>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
