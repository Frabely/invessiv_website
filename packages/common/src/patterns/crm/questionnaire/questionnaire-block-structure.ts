import { QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";

/** Block-level fields and group sub-fields in display order; works on any field shape with children. */
export function flattenQuestionnaireFields<
  TField extends { children: readonly TField[] },
>(fields: readonly TField[]): TField[] {
  return fields.flatMap((field) => [field, ...field.children]);
}

export function findQuestionnaireField(
  block: QuestionnaireBlockDto,
  fieldId: string,
): QuestionnaireFieldDto | undefined {
  return flattenQuestionnaireFields(block.fields).find(
    (field) => field.id === fieldId,
  );
}

/** The fields of one level: the block itself for null, otherwise the sub-fields of that group. */
export function questionnaireFieldLevel(
  block: QuestionnaireBlockDto,
  parentFieldId: string | null,
): QuestionnaireFieldDto[] {
  if (parentFieldId === null) return block.fields;
  return findQuestionnaireField(block, parentFieldId)?.children ?? [];
}

/**
 * Fields that may trigger a condition of `fieldId` on the given level: a choice or yes/no field
 * above it. A new field (`fieldId` null) is appended, so every such field of the level qualifies.
 */
export function questionnaireConditionCandidates(
  block: QuestionnaireBlockDto,
  parentFieldId: string | null,
  fieldId: string | null,
): QuestionnaireFieldDto[] {
  const level = questionnaireFieldLevel(block, parentFieldId);
  const own = fieldId ? level.find((field) => field.id === fieldId) : undefined;
  return level.filter(
    (field) =>
      (
        QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES as readonly string[]
      ).includes(field.type) &&
      field.id !== fieldId &&
      (own === undefined || field.position < own.position),
  );
}

/**
 * The condition as the block allows it right now: none when the trigger is no valid candidate
 * anymore, the first option when the chosen one is gone. After a conflict the block may have
 * changed under an open dialog, so what is shown and what is sent must come from here.
 */
export function resolveQuestionnaireCondition(
  block: QuestionnaireBlockDto,
  parentFieldId: string | null,
  fieldId: string | null,
  triggerId: string | null,
  choiceId: string | null,
): Pick<QuestionnaireFieldDto, "conditionFieldId" | "conditionChoiceId"> {
  const trigger = questionnaireConditionCandidates(
    block,
    parentFieldId,
    fieldId,
  ).find((candidate) => candidate.id === triggerId);
  const choice =
    trigger?.choices.find((candidate) => candidate.id === choiceId) ??
    trigger?.choices[0];
  if (!trigger || !choice)
    return { conditionFieldId: null, conditionChoiceId: null };
  return { conditionFieldId: trigger.id, conditionChoiceId: choice.id };
}
