const MINUS_SIGN = "−";

/**
 * Whole minutes as `h:mm`: 90 → "1:30", 0 → "0:00", -60 → "−1:00". Durations are stored as
 * integers, so a fraction is a programming error rather than something to round away.
 */
export function formatDuration(minutes: number): string {
  if (!Number.isInteger(minutes)) {
    throw new RangeError(
      `formatDuration expects whole minutes, received: ${minutes}`,
    );
  }
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const rest = String(absolute % 60).padStart(2, "0");
  return `${minutes < 0 ? MINUS_SIGN : ""}${hours}:${rest}`;
}
