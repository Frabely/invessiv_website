/**
 * Shared by the Drizzle models, request validation and the editors. The `stored*` values are the
 * hard ceilings of the database, deliberately above the working limits so a limit can grow without
 * a migration. Migration 0047 repeats the numbers as SQL literals;
 * `questionnaire-limits-migration.test.ts` keeps both in step.
 */
export const QUESTIONNAIRE_LIMITS = {
  blocksPerOwner: 60,
  fieldsPerBlock: 60,
  childFieldsPerGroup: 30,
  choicesPerField: 30,
  groupEntriesPerField: 50,
  filesPerField: 30,
  shortTextDefaultMaxLength: 300,
  longTextDefaultMaxLength: 5_000,
  keyMaxLength: 63,
  titleMaxLength: 120,
  labelMaxLength: 300,
  helpMaxLength: 2_000,
  introMaxLength: 2_000,
  noteMaxLength: 2_000,
  choiceLabelMaxLength: 200,
  templateDescriptionMaxLength: 1_000,
  scaleSteps: 5,
  storedPositionCeiling: 100,
  storedChoicePositionCeiling: 50,
  storedItemCountCeiling: 100,
  storedValueMaxLength: 50_000,
} as const;
