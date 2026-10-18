/** Native `<progress>` attributes for "used of available"; an overdrawn bar stays full, never wider. */
export function hoursMeter(
  usedMinutes: number,
  availableMinutes: number,
): { max: number; value: number } {
  const max = Math.max(availableMinutes, 1);
  return { max, value: Math.min(Math.max(usedMinutes, 0), max) };
}
