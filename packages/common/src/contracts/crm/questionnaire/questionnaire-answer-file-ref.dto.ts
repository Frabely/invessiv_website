/** Where a file hangs in a form; all the completeness check needs to know about it. */
export interface QuestionnaireAnswerFileRefDto {
  /** Files field the file is attached to. */
  fieldId: string;
  /** Group entry of a files sub-field; null on block level. */
  groupEntryId: string | null;
}
