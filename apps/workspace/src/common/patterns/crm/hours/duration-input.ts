import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { parseDuration } from "@invessiv/common/patterns/crm/hours/parse-duration";
import { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";

/** Reads a typed duration as positive minutes, or says why it cannot be used. */
export function readDurationInput(
  text: string,
  maxMinutes: number = HoursLimits.MaxLedgerMinutes,
): { ok: true; minutes: number } | { ok: false; error: DurationInputError } {
  if (text.trim() === "") {
    return { ok: false, error: DurationInputError.Required };
  }
  const minutes = parseDuration(text);
  if (minutes === null) {
    return { ok: false, error: DurationInputError.Invalid };
  }
  if (minutes === 0) {
    return { ok: false, error: DurationInputError.Required };
  }
  if (minutes > maxMinutes) {
    return { ok: false, error: DurationInputError.TooMuch };
  }
  return { ok: true, minutes };
}

/**
 * Moves a typed duration by whole booking steps and returns it as `h:mm`. Unreadable text counts
 * as zero, so the buttons always lead somewhere; the result never leaves `0…maxMinutes`.
 */
export function stepDurationInput(
  text: string,
  steps: number,
  maxMinutes: number = HoursLimits.MaxLedgerMinutes,
): string {
  const current = parseDuration(text) ?? 0;
  const next = current + steps * HoursLimits.StepMinutes;
  return formatDuration(Math.min(Math.max(next, 0), maxMinutes));
}
