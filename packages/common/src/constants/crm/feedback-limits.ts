/**
 * Shared by the Drizzle model, request validation and the UI counters. Migration 0045 repeats the
 * numbers as SQL literals; `feedback-limits-migration.test.ts` keeps both in step.
 */
export const FEEDBACK_LIMITS = {
  itemsPerRound: 30,
  itemBodyMaxLength: 5_000,
  areaLabelMaxLength: 80,
  areasPerProject: 30,
  noteMaxLength: 2_000,
  previewUrlMaxLength: 2_048,
  filesPerItem: 10,
  filesPerRound: 50,
  roundsPerProject: 20,
} as const;
