import { ONBOARDING_CONFIRMED_VALUE } from "../../../constants/crm/onboarding/onboarding-confirmed-value";
import { OnboardingFieldRequirement } from "../../../constants/crm/onboarding/onboarding-field-requirements";
import { OnboardingFieldType } from "../../../constants/crm/onboarding/onboarding-field-types";
import type { OnboardingAnswerDto } from "../../../contracts/crm/onboarding/onboarding-answer.dto";
import type { OnboardingBlockProgress } from "../../../contracts/crm/onboarding/onboarding-block-progress";
import type { OnboardingCompleteness } from "../../../contracts/crm/onboarding/onboarding-completeness";
import type { OnboardingCompletenessInput } from "../../../contracts/crm/onboarding/onboarding-completeness-input";
import type { OnboardingFieldDto } from "../../../contracts/crm/onboarding/onboarding-field.dto";
import type { OnboardingGroupEntryDto } from "../../../contracts/crm/onboarding/onboarding-group-entry.dto";
import type { OnboardingMissingField } from "../../../contracts/crm/onboarding/onboarding-missing-field";

type CompletenessIndex = {
  fields: ReadonlyMap<string, OnboardingFieldDto>;
  answers: ReadonlyMap<string, OnboardingAnswerDto[]>;
  fileCounts: ReadonlyMap<string, number>;
  entries: ReadonlyMap<string, OnboardingGroupEntryDto[]>;
  visibility: Map<string, boolean>;
  servicesConfirmed: boolean;
};

type FieldEvaluation = { counts: boolean; answered: boolean };

function slotKey(fieldId: string, groupEntryId: string | null): string {
  return `${fieldId}|${groupEntryId ?? ""}`;
}

function byPosition<T extends { position: number }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => left.position - right.position);
}

function groupBy<T>(items: readonly T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item));
    if (group) group.push(item);
    else groups.set(key(item), [item]);
  }
  return groups;
}

function buildIndex(input: OnboardingCompletenessInput): CompletenessIndex {
  const fields = new Map<string, OnboardingFieldDto>();
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
    entries.set(fieldId, byPosition(group));
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
): readonly OnboardingAnswerDto[] {
  return index.answers.get(slotKey(fieldId, groupEntryId)) ?? [];
}

/**
 * A condition only counts when its trigger sits in the same block on the same level and is itself
 * visible; anything else, including a cycle the write path failed to prevent, hides the field.
 */
function isVisible(
  field: OnboardingFieldDto,
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
  field: OnboardingFieldDto,
  groupEntryId: string | null,
  index: CompletenessIndex,
): number | null {
  switch (field.type) {
    case OnboardingFieldType.MultiChoice:
      return answersOf(index, field.id, groupEntryId).filter(
        (answer) => answer.choiceId !== null,
      ).length;
    case OnboardingFieldType.Files:
      return index.fileCounts.get(slotKey(field.id, groupEntryId)) ?? 0;
    case OnboardingFieldType.Group:
      return index.entries.get(field.id)?.length ?? 0;
    default:
      return null;
  }
}

function hasAnswer(
  field: OnboardingFieldDto,
  groupEntryId: string | null,
  index: CompletenessIndex,
): boolean {
  const answers = answersOf(index, field.id, groupEntryId);
  switch (field.type) {
    case OnboardingFieldType.Choice:
    case OnboardingFieldType.YesNo:
      return answers.some((answer) => answer.choiceId !== null);
    case OnboardingFieldType.Confirmation:
      return answers.some(
        (answer) => answer.value === ONBOARDING_CONFIRMED_VALUE,
      );
    case OnboardingFieldType.ProjectServices:
      return index.servicesConfirmed;
    default:
      return answers.some(
        (answer) => answer.value !== null && answer.value.trim() !== "",
      );
  }
}

/** `min_items` also binds an optional field as soon as it has one entry. */
function evaluate(
  field: OnboardingFieldDto,
  groupEntryId: string | null,
  index: CompletenessIndex,
): FieldEvaluation {
  const required = field.requirement === OnboardingFieldRequirement.Required;
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

export function isOnboardingFieldVisible(
  field: OnboardingFieldDto,
  input: OnboardingCompletenessInput,
  groupEntryId: string | null = null,
): boolean {
  return isVisible(field, groupEntryId, buildIndex(input), new Set());
}

/**
 * The only place that decides visibility, required answers and progress. Portal, CRM, submitting
 * and completing all call it, so they can never disagree about what is missing.
 */
export function getOnboardingCompleteness(
  input: OnboardingCompletenessInput,
): OnboardingCompleteness {
  const index = buildIndex(input);
  const missing: OnboardingMissingField[] = [];
  const blocks: OnboardingBlockProgress[] = [];

  for (const block of input.blocks) {
    const progress = {
      blockId: block.id,
      answeredRequired: 0,
      totalRequired: 0,
    };
    const visit = (field: OnboardingFieldDto, groupEntryId: string | null) => {
      if (!isVisible(field, groupEntryId, index, new Set())) return false;
      const { counts, answered } = evaluate(field, groupEntryId, index);
      if (counts) progress.totalRequired += 1;
      if (counts && answered) progress.answeredRequired += 1;
      if (counts && !answered)
        missing.push({ blockId: block.id, fieldId: field.id, groupEntryId });
      return true;
    };
    for (const field of byPosition(block.fields)) {
      if (!visit(field, null) || field.type !== OnboardingFieldType.Group)
        continue;
      const children = byPosition(field.children);
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
