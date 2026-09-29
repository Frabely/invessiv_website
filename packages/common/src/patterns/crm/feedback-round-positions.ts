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
