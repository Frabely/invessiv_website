/** Shared by the migration, request validation and the UI counters. */
export const FEEDBACK_LIMITS = {
  itemsPerRound: 30,
  itemBodyMaxLength: 5_000,
  areaLabelMaxLength: 80,
  areasPerProject: 30,
  noteMaxLength: 2_000,
  filesPerItem: 10,
  filesPerRound: 50,
  roundsPerProject: 20,
} as const;
