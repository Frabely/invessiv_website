export const DateRangePreset = {
  Today: "today",
  Last7Days: "last-7-days",
  Last30Days: "last-30-days",
  Last90Days: "last-90-days",
  All: "all",
  Custom: "custom",
} as const;

export type DateRangePreset =
  (typeof DateRangePreset)[keyof typeof DateRangePreset];

export type DateRangeDefaultPreset = Exclude<
  DateRangePreset,
  typeof DateRangePreset.Custom
>;

export const DateRangePresetDays = {
  [DateRangePreset.Today]: 1,
  [DateRangePreset.Last7Days]: 7,
  [DateRangePreset.Last30Days]: 30,
  [DateRangePreset.Last90Days]: 90,
} as const;
