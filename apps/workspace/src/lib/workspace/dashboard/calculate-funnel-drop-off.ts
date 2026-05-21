export function calculateFunnelDropOff(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) {
    return null;
  }
  if (current >= previous) {
    return 1;
  }
  if (current <= 0) {
    return 0;
  }
  return current / previous;
}
