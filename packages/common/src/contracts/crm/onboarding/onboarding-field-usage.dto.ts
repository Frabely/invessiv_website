/** What deleting a field of a form would take with it; shown in the delete confirmation. */
export interface OnboardingFieldUsageDto {
  /** Answered slots of the field and, for a group, of its sub-fields across all entries. */
  answers: number;
  /** File links of the field and its sub-fields; the files themselves stay with the customer. */
  files: number;
}
