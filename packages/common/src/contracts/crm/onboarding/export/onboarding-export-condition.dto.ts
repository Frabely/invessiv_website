/** The answer of another question that makes a question visible. */
export interface OnboardingExportConditionDto {
  /** Key of the triggering question in the same block and on the same level. */
  fieldKey: string;
  /** Key of the option that must be selected. */
  optionKey: string;
  /** Label of that option in the export locale. */
  optionLabel: string;
}
