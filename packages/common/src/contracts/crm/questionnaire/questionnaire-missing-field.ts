/** A visible required field without a sufficient answer. */
export interface QuestionnaireMissingField {
  blockId: string;
  fieldId: string;
  /** Group entry of a missing sub-field; null on block level and for a group lacking entries. */
  groupEntryId: string | null;
}
