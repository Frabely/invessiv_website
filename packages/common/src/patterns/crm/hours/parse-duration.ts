import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";

const CLOCK_PATTERN = /^(\d{1,5}):([0-5]\d)$/;
const DECIMAL_PATTERN = /^\d{1,5}(?:[.,]\d{1,2})?$/;

/**
 * Reads a typed duration as whole minutes: "1:30", "1,5", "1.5" and "2" are all accepted. Returns
 * null for anything that is not a non-negative duration on the booking step. It never rounds — a
 * silently adjusted value would book a different time than the one the user typed.
 */
export function parseDuration(input: string): number | null {
  const text = input.trim();
  let minutes: number;

  const clock = CLOCK_PATTERN.exec(text);
  if (clock) {
    minutes = Number(clock[1]) * 60 + Number(clock[2]);
  } else if (DECIMAL_PATTERN.test(text)) {
    minutes = Number(text.replace(",", ".")) * 60;
  } else {
    return null;
  }

  if (!Number.isInteger(minutes) || minutes % HoursLimits.StepMinutes !== 0) {
    return null;
  }
  return minutes;
}
