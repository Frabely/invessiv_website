import {
  DateRangePreset,
  type DateRangePreset as DateRangePresetValue,
  DateRangePresetDays,
} from "@/common/constants/date-range/date-range-presets";
import type { DateRangeChange } from "@/common/contracts/date-range/date-range-change";

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRangeForPreset(
  preset: DateRangePresetValue,
  now: Date = new Date(),
): DateRangeChange {
  if (preset === DateRangePreset.All || preset === DateRangePreset.Custom) {
    return { preset, from: undefined, to: undefined };
  }

  const days = DateRangePresetDays[preset];
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const from = new Date(to.getTime());
  from.setUTCDate(from.getUTCDate() - (days - 1));

  return { preset, from: formatUtcDate(from), to: formatUtcDate(to) };
}
