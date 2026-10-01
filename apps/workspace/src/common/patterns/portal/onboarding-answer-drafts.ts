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
import { validateQuestionnaireValue } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import type { OnboardingAnswerDrafts } from "@/common/contracts/portal/onboarding-answer-drafts";

const CHOICE_ANSWER_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES;

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

/** The stored block-level answers as drafts; answers within group entries are not edited here. */
function fromAnswers(
  answers: readonly QuestionnaireAnswerDto[],
): Map<string, string[]> {
  const drafts = new Map<string, string[]>();
  const rows = answers
    .filter((answer) => answer.groupEntryId === null)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  for (const answer of rows) {
    const entry = answer.choiceId ?? answer.value;
    if (entry === null) continue;
    const entries = drafts.get(answer.fieldId);
    if (entries) entries.push(entry);
    else drafts.set(answer.fieldId, [entry]);
  }
  return drafts;
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
 * every keystroke. Text that would not be saved does not count as an answer; answers the drafts do
 * not cover (group entries) pass through unchanged.
 */
function toAnswers(
  drafts: OnboardingAnswerDrafts,
  fields: ReadonlyMap<string, Field>,
  stored: readonly QuestionnaireAnswerDto[],
): QuestionnaireAnswerDto[] {
  const answers = stored.filter((answer) => answer.groupEntryId !== null);
  for (const [fieldId, entries] of drafts) {
    const field = fields.get(fieldId);
    if (!field) continue;
    const slot = { fieldId, groupEntryId: null };
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

/** Blank text clears the slot, like an empty selection does. */
function toRequest(
  field: Field,
  entries: readonly string[],
): SavePortalOnboardingAnswerRequestDto {
  const slot = { fieldId: field.id, groupEntryId: null };
  if (isChoiceField(field)) return { ...slot, choiceIds: [...entries] };
  const text = entries[0] ?? "";
  return { ...slot, values: text.trim() === "" ? [] : [text] };
}

export const onboardingAnswerDrafts = {
  isChoiceField,
  indexFields,
  fromAnswers,
  validate,
  toAnswers,
  toRequest,
} as const;
