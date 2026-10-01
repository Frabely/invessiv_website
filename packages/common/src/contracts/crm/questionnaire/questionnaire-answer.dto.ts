/**
 * One stored answer row. A multi choice has one row per selected option; files, groups and the
 * service confirmation never appear here.
 */
export interface QuestionnaireAnswerDto {
  /** Field the answer belongs to. */
  fieldId: string;
  /** Group entry of a sub-field answer; null on block level. */
  groupEntryId: string | null;
  /** Order of the rows of one field and entry; 0 unless the field is a multi choice. */
  sortOrder: number;
  /** Text, scale step or `"true"` of a confirmation; null exactly when `choiceId` is set. */
  value: string | null;
  /** Selected option of a choice, multi choice or yes/no field; null exactly when `value` is set. */
  choiceId: string | null;
}
