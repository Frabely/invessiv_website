/** A visible required field without an answer, as the review step lists it. */
export interface OnboardingMissingAnswer {
  blockId: string;
  blockTitle: string;
  fieldId: string;
  /** Entry the answer is missing in; null on block level. */
  groupEntryId: string | null;
  fieldLabel: string;
}
