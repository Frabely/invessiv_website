/** Round numbers follow the track order, so every reader and writer sorts positions the same way. */
export function sortFeedbackRoundPositions(
  positions: readonly number[],
): number[] {
  return [...positions].sort((a, b) => a - b);
}

/** Readers clamp out-of-range positions into the step list, so no round silently disappears. */
export function normalizeFeedbackRoundPositions(
  positions: readonly number[],
  stepCount: number,
): number[] {
  return sortFeedbackRoundPositions(
    positions.map((position) => Math.min(Math.max(position, 0), stepCount)),
  );
}

/**
 * Handed-over rounds 1 … `handedOverRounds` must keep their place in the track: the same index and
 * the same free-text neighbours on both sides. Otherwise a round the customer already works on
 * would move, get renumbered or vanish. Steps elsewhere may still be renamed, added or removed.
 */
export function keepsHandedOverRoundPositions({
  before,
  after,
  handedOverRounds,
}: {
  before: { processSteps: readonly string[]; positions: readonly number[] };
  after: { processSteps: readonly string[]; positions: readonly number[] };
  handedOverRounds: number;
}): boolean {
  const previous = normalizeFeedbackRoundPositions(
    before.positions,
    before.processSteps.length,
  );
  const next = normalizeFeedbackRoundPositions(
    after.positions,
    after.processSteps.length,
  );
  for (let index = 0; index < handedOverRounds; index += 1) {
    const position = previous[index];
    if (position === undefined) continue;
    if (next[index] !== position) return false;
    if (
      before.processSteps[position - 1] !== after.processSteps[position - 1] ||
      before.processSteps[position] !== after.processSteps[position]
    )
      return false;
  }
  return true;
}
