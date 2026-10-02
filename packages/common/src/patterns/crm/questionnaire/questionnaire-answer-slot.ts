import {
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
  type QuestionnaireFieldType,
} from "../../../constants/crm/questionnaire/questionnaire-field-types";

// Neither a uuid nor a field key contains it, so a key splits back into its two parts.
const ENTRY_SEPARATOR = "@";

const CHOICE_ANSWER_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES;

/**
 * The key of one slot: the field id on block level, field and entry for a sub-field within a
 * group entry. Completeness, drafts, save states and DOM ids of a form all go by it.
 */
export function questionnaireSlotKey(
  fieldId: string,
  groupEntryId: string | null,
): string {
  return groupEntryId === null
    ? fieldId
    : `${fieldId}${ENTRY_SEPARATOR}${groupEntryId}`;
}

export function parseQuestionnaireSlotKey(key: string): {
  fieldId: string;
  groupEntryId: string | null;
} {
  const at = key.indexOf(ENTRY_SEPARATOR);
  return at === -1
    ? { fieldId: key, groupEntryId: null }
    : { fieldId: key.slice(0, at), groupEntryId: key.slice(at + 1) };
}

/** Whether a field of this type is answered by chosen options instead of a value. */
export function isQuestionnaireChoiceAnswerType(
  type: QuestionnaireFieldType,
): boolean {
  return CHOICE_ANSWER_TYPES.includes(type);
}
