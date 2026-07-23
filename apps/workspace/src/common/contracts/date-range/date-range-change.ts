import type { DateRangePreset } from "@/common/constants/date-range/date-range-presets";

export type DateRangeChange = {
  preset: DateRangePreset;
  from: string | undefined;
  to: string | undefined;
};
