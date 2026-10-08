/** Every duration in the hours domain is a whole number of minutes and a multiple of `StepMinutes`. */
export const HoursLimits = {
  StepMinutes: 15,
  MaxEntryMinutes: 1440,
  MaxLedgerMinutes: 600000,
  NoteMaxLength: 200,
  DescriptionMaxLength: 500,
  HistoryPreviewSize: 20,
} as const;
