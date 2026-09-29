/** Round numbers follow the track order, so every reader and writer sorts positions the same way. */
export function sortFeedbackRoundPositions(
  positions: readonly number[],
): number[] {
  return [...positions].sort((a, b) => a - b);
}
