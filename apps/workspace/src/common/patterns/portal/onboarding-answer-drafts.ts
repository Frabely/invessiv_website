import {
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
  type QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireResolvedBlock } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-block";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { SavePortalOnboardingAnswerRequestDto } from "@invessiv/common/contracts/portal/save-portal-onboarding-answer-request.dto";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { isQuestionnaireFieldVisible } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { validateQuestionnaireValue } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import type { OnboardingAnswerDrafts } from "@/common/contracts/portal/onboarding-answer-drafts";

const CHOICE_ANSWER_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES;

// Neither a uuid nor a field key contains it, so a key splits back into its two parts.
const ENTRY_SEPARATOR = "@";

type Field = Pick<QuestionnaireResolvedField, "id" | "type" | "maxLength">;

function isChoiceField(field: Pick<Field, "type">): boolean {
  return CHOICE_ANSWER_TYPES.includes(field.type);
}

function indexFields(
  blocks: readonly QuestionnaireResolvedBlock[],
): Map<string, QuestionnaireResolvedField> {
  return new Map(
    blocks
      .flatMap((block) => flattenQuestionnaireFields(block.fields))
      .map((field) => [field.id, field]),
  );
}

/**
 * The key of one slot: the field id on block level, field and entry for a sub-field within a
 * group entry. Drafts, save states and DOM ids of a form all go by it.
 */
function slotKey(fieldId: string, groupEntryId: string | null): string {
  return groupEntryId === null
    ? fieldId
    : `${fieldId}${ENTRY_SEPARATOR}${groupEntryId}`;
}

function parseSlotKey(key: string): {
  fieldId: string;
  groupEntryId: string | null;
} {
  const at = key.indexOf(ENTRY_SEPARATOR);
  return at === -1
    ? { fieldId: key, groupEntryId: null }
    : { fieldId: key.slice(0, at), groupEntryId: key.slice(at + 1) };
}

/** The stored answers as drafts, one list per slot in stored order. */
function fromAnswers(
  answers: readonly QuestionnaireAnswerDto[],
): Map<string, string[]> {
  const drafts = new Map<string, string[]>();
  const rows = [...answers].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  for (const answer of rows) {
    const entry = answer.choiceId ?? answer.value;
    if (entry === null) continue;
    const key = slotKey(answer.fieldId, answer.groupEntryId);
    const entries = drafts.get(key);
    if (entries) entries.push(entry);
    else drafts.set(key, [entry]);
  }
  return drafts;
}

/** The drafts without the slots of a removed group entry. */
function dropEntry(
  drafts: OnboardingAnswerDrafts,
  groupEntryId: string,
): Map<string, string[]> {
  return new Map(
    [...drafts]
      .filter(([key]) => parseSlotKey(key).groupEntryId !== groupEntryId)
      .map(([key, entries]) => [key, [...entries]]),
  );
}

/** Why the typed text cannot be saved; null for choices, blank text and valid text. */
function validate(
  field: Field,
  entries: readonly string[],
): QuestionnaireValueErrorCode | null {
  const text = entries[0] ?? "";
  if (isChoiceField(field) || text.trim() === "") return null;
  const result = validateQuestionnaireValue(field, text);
  return result.ok ? null : result.code;
}

/**
 * The drafts as answer rows for `getQuestionnaireCompleteness`, so conditions and progress follow
 * every keystroke. Text that would not be saved does not count as an answer.
 */
function toAnswers(
  drafts: OnboardingAnswerDrafts,
  fields: ReadonlyMap<string, Field>,
): QuestionnaireAnswerDto[] {
  const answers: QuestionnaireAnswerDto[] = [];
  for (const [key, entries] of drafts) {
    const slot = parseSlotKey(key);
    const field = fields.get(slot.fieldId);
    if (!field) continue;
    if (isChoiceField(field)) {
      entries.forEach((choiceId, sortOrder) =>
        answers.push({ ...slot, sortOrder, value: null, choiceId }),
      );
      continue;
    }
    const text = entries[0] ?? "";
    if (text.trim() !== "" && validate(field, entries) === null)
      answers.push({ ...slot, sortOrder: 0, value: text, choiceId: null });
  }
  return answers;
}

/**
 * Slots whose text cannot be saved, with the reason. A field its condition hides is left out: the
 * customer cannot reach it, so its text must neither warn nor hold up the submission. Visibility
 * only reads the answers, so files, entries and the services are not needed here.
 */
function listInvalid(
  drafts: OnboardingAnswerDrafts,
  fields: ReadonlyMap<string, QuestionnaireResolvedField>,
  blocks: readonly QuestionnaireResolvedBlock[],
): Map<string, QuestionnaireValueErrorCode> {
  const input = {
    blocks,
    answers: toAnswers(drafts, fields),
    answerFiles: [],
    groupEntries: [],
    servicesConfirmed: false,
  };
  const invalid = new Map<string, QuestionnaireValueErrorCode>();
  for (const [key, entries] of drafts) {
    const slot = parseSlotKey(key);
    const field = fields.get(slot.fieldId);
    const code = field && validate(field, entries);
    if (code && isQuestionnaireFieldVisible(field, input, slot.groupEntryId))
      invalid.set(key, code);
  }
  return invalid;
}

/** Blank text clears the slot, like an empty selection does. */
function toRequest(
  field: Field,
  entries: readonly string[],
  groupEntryId: string | null = null,
): SavePortalOnboardingAnswerRequestDto {
  const slot = { fieldId: field.id, groupEntryId };
  if (isChoiceField(field)) return { ...slot, choiceIds: [...entries] };
  const text = entries[0] ?? "";
  return { ...slot, values: text.trim() === "" ? [] : [text] };
}

export const onboardingAnswerDrafts = {
  isChoiceField,
  indexFields,
  slotKey,
  parseSlotKey,
  fromAnswers,
  dropEntry,
  validate,
  listInvalid,
  toAnswers,
  toRequest,
} as const;
