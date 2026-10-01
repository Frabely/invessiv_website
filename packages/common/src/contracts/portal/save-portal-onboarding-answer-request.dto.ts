/**
 * Replaces everything stored in one slot: a field on block level, or a sub-field within one group
 * entry. Exactly one of `values` and `choiceIds` is sent; an empty list clears the slot.
 */
export interface SavePortalOnboardingAnswerRequestDto {
  /** Field the answer belongs to; it must sit in a block of the addressed form. */
  fieldId: string;
  /** Group entry of a sub-field answer; null on block level. */
  groupEntryId: string | null;
  /** The text of a value field as a list of at most one entry. */
  values?: string[];
  /** Selected options of a choice, multi choice or yes/no field, in display order. */
  choiceIds?: string[];
}
