import { QUESTIONNAIRE_CONFIRMED_VALUE } from "../../../constants/crm/questionnaire/questionnaire-confirmed-value";
import { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireAnswerDto } from "../../../contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireBlockProgress } from "../../../contracts/crm/questionnaire/questionnaire-block-progress";
import type { QuestionnaireCompleteness } from "../../../contracts/crm/questionnaire/questionnaire-completeness";
import type { QuestionnaireCompletenessInput } from "../../../contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireCompletenessField } from "../../../contracts/crm/questionnaire/questionnaire-completeness-field";
import type { QuestionnaireGroupEntryDto } from "../../../contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { QuestionnaireMissingField } from "../../../contracts/crm/questionnaire/questionnaire-missing-field";
import { compareByPosition } from "../../collections/compare-by-position";
import { groupBy } from "../../collections/group-by";
import { questionnaireSlotKey as slotKey } from "./questionnaire-answer-slot";

type CompletenessIndex = {
  fields: ReadonlyMap<string, QuestionnaireCompletenessField>;
  answers: ReadonlyMap<string, QuestionnaireAnswerDto[]>;
  fileCounts: ReadonlyMap<string, number>;
  entries: ReadonlyMap<string, QuestionnaireGroupEntryDto[]>;
  visibility: Map<string, boolean>;
  servicesConfirmed: boolean;
};

type FieldEvaluation = { counts: boolean; answered: boolean };

function buildIndex(input: QuestionnaireCompletenessInput): CompletenessIndex {
  const fields = new Map<string, QuestionnaireCompletenessField>();
  for (const block of input.blocks)
    for (const field of block.fields) {
      fields.set(field.id, field);
      for (const child of field.children) fields.set(child.id, child);
    }
  const fileCounts = new Map<string, number>();
  for (const file of input.answerFiles) {
    const key = slotKey(file.fieldId, file.groupEntryId);
    fileCounts.set(key, (fileCounts.get(key) ?? 0) + 1);
  }
  const entries = groupBy(input.groupEntries, (entry) => entry.fieldId);
  for (const [fieldId, group] of entries)
    entries.set(fieldId, [...group].sort(compareByPosition));
  return {
    fields,
    answers: groupBy(input.answers, (answer) =>
      slotKey(answer.fieldId, answer.groupEntryId),
    ),
    fileCounts,
    entries,
    visibility: new Map(),
    servicesConfirmed: input.servicesConfirmed,
  };
}

function answersOf(
  index: CompletenessIndex,
  fieldId: string,
  groupEntryId: string | null,
): readonly QuestionnaireAnswerDto[] {
  return index.answers.get(slotKey(fieldId, groupEntryId)) ?? [];
}

/**
 * A condition only counts when its trigger sits in the same block on the same level and is itself
 * visible; anything else, including a cycle the write path failed to prevent, hides the field.
 */
function isVisible(
  field: QuestionnaireCompletenessField,
  groupEntryId: string | null,
  index: CompletenessIndex,
  visiting: Set<string>,
): boolean {
  const key = slotKey(field.id, groupEntryId);
  const cached = index.visibility.get(key);
  if (cached !== undefined) return cached;
  if (visiting.has(key)) return false;
  visiting.add(key);

  let visible = true;
  if (field.parentFieldId !== null) {
    const group = index.fields.get(field.parentFieldId);
    visible = group !== undefined && isVisible(group, null, index, visiting);
  }
  if (
    visible &&
    field.conditionFieldId !== null &&
    field.conditionChoiceId !== null
  ) {
    const trigger = index.fields.get(field.conditionFieldId);
    visible =
      trigger !== undefined &&
      trigger.blockId === field.blockId &&
      trigger.parentFieldId === field.parentFieldId &&
      isVisible(trigger, groupEntryId, index, visiting) &&
      answersOf(index, trigger.id, groupEntryId).some(
        (answer) => answer.choiceId === field.conditionChoiceId,
      );
  }

  visiting.delete(key);
  index.visibility.set(key, visible);
  return visible;
}

function countItems(
  field: QuestionnaireCompletenessField,
  groupEntryId: string | null,
  index: CompletenessIndex,
): number | null {
  switch (field.type) {
    case QuestionnaireFieldType.MultiChoice:
      return answersOf(index, field.id, groupEntryId).filter(
        (answer) => answer.choiceId !== null,
      ).length;
    case QuestionnaireFieldType.Files:
      return index.fileCounts.get(slotKey(field.id, groupEntryId)) ?? 0;
    case QuestionnaireFieldType.Group:
      return index.entries.get(field.id)?.length ?? 0;
    default:
      return null;
  }
}

function hasAnswer(
  field: QuestionnaireCompletenessField,
  groupEntryId: string | null,
  index: CompletenessIndex,
): boolean {
  const answers = answersOf(index, field.id, groupEntryId);
  switch (field.type) {
    case QuestionnaireFieldType.Choice:
    case QuestionnaireFieldType.YesNo:
      return answers.some((answer) => answer.choiceId !== null);
    case QuestionnaireFieldType.Confirmation:
      return answers.some(
        (answer) => answer.value === QUESTIONNAIRE_CONFIRMED_VALUE,
      );
    case QuestionnaireFieldType.ProjectServices:
      return index.servicesConfirmed;
    default:
      return answers.some(
        (answer) => answer.value !== null && answer.value.trim() !== "",
      );
  }
}

/** `min_items` also binds an optional field as soon as it has one entry. */
function evaluate(
  field: QuestionnaireCompletenessField,
  groupEntryId: string | null,
  index: CompletenessIndex,
): FieldEvaluation {
  const required = field.requirement === QuestionnaireFieldRequirement.Required;
  const items = countItems(field, groupEntryId, index);
  if (items === null)
    return required
      ? { counts: true, answered: hasAnswer(field, groupEntryId, index) }
      : { counts: false, answered: false };
  const minItems = field.minItems ?? 0;
  if (required)
    return { counts: true, answered: items >= Math.max(1, minItems) };
  if (items > 0 && items < minItems) return { counts: true, answered: false };
  return { counts: false, answered: false };
}

export function isQuestionnaireFieldVisible(
  field: QuestionnaireCompletenessField,
  input: QuestionnaireCompletenessInput,
  groupEntryId: string | null = null,
): boolean {
  return isVisible(field, groupEntryId, buildIndex(input), new Set());
}

/**
 * The only place that decides visibility, required answers and progress. Portal, CRM, submitting
 * and completing all call it, so they can never disagree about what is missing.
 */
export function getQuestionnaireCompleteness(
  input: QuestionnaireCompletenessInput,
): QuestionnaireCompleteness {
  const index = buildIndex(input);
  const missing: QuestionnaireMissingField[] = [];
  const blocks: QuestionnaireBlockProgress[] = [];

  for (const block of input.blocks) {
    const progress = {
      blockId: block.id,
      answeredRequired: 0,
      totalRequired: 0,
    };
    const visit = (
      field: QuestionnaireCompletenessField,
      groupEntryId: string | null,
    ) => {
      if (!isVisible(field, groupEntryId, index, new Set())) return false;
      const { counts, answered } = evaluate(field, groupEntryId, index);
      if (counts) progress.totalRequired += 1;
      if (counts && answered) progress.answeredRequired += 1;
      if (counts && !answered)
        missing.push({ blockId: block.id, fieldId: field.id, groupEntryId });
      return true;
    };
    for (const field of [...block.fields].sort(compareByPosition)) {
      if (!visit(field, null) || field.type !== QuestionnaireFieldType.Group)
        continue;
      const children = [...field.children].sort(compareByPosition);
      for (const entry of index.entries.get(field.id) ?? [])
        for (const child of children) visit(child, entry.id);
    }
    blocks.push(progress);
  }

  const answeredRequired = blocks.reduce(
    (sum, block) => sum + block.answeredRequired,
    0,
  );
  const totalRequired = blocks.reduce(
    (sum, block) => sum + block.totalRequired,
    0,
  );
  return {
    missing,
    blocks,
    answeredRequired,
    totalRequired,
    ratio: totalRequired === 0 ? 1 : answeredRequired / totalRequired,
  };
}
