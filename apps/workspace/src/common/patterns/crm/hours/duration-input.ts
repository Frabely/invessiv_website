import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
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
