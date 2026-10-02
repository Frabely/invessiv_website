/** One slot of a form as the portal addresses it: a field, and the group entry of a sub-field. */
export interface OnboardingAnswerSlotRef {
  /** Field the slot belongs to. */
  fieldId: string;
  /** Group entry of a sub-field; null on block level. */
  groupEntryId: string | null;
}
