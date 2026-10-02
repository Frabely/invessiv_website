import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";

/** Test data for the portal onboarding form: fields, blocks and a form any contact may edit. */
export function portalOnboardingField(
  id: string,
  overrides: Partial<QuestionnaireResolvedField> = {},
): QuestionnaireResolvedField {
  return {
    id,
    blockId: "block-1",
    parentFieldId: null,
    position: 0,
    type: QuestionnaireFieldType.ShortText,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    label: id,
    help: null,
    choices: [],
    children: [],
    ...overrides,
  };
}

/** Options `<fieldId>-<key>` with the key as label. */
export function portalOnboardingChoices(fieldId: string, ...keys: string[]) {
  return keys.map((key, position) => ({
    id: `${fieldId}-${key}`,
    position,
    label: key,
  }));
}

/** A block whose fields get its id and positions in list order. */
export function portalOnboardingBlock(
  id: string,
  fields: QuestionnaireResolvedField[],
  overrides: Partial<PortalOnboardingBlockDto> = {},
): PortalOnboardingBlockDto {
  return {
    id,
    position: 0,
    title: id,
    intro: null,
    fallbackLocale: null,
    prefilled: false,
    reviewNote: null,
    fields: fields.map((field, position) => ({
      ...field,
      blockId: id,
      position,
    })),
    ...overrides,
  };
}

export function portalOnboardingAnswer(
  fieldId: string,
  content: { value: string } | { choiceId: string },
  sortOrder = 0,
): QuestionnaireAnswerDto {
  return {
    fieldId,
    groupEntryId: null,
    sortOrder,
    value: "value" in content ? content.value : null,
    choiceId: "choiceId" in content ? content.choiceId : null,
  };
}

/** An open form in which every block is editable. */
export function portalOnboardingForm(
  blocks: PortalOnboardingBlockDto[],
  overrides: Partial<PortalOnboardingFormDto> = {},
): PortalOnboardingFormDto {
  return {
    id: "form-1",
    projectId: "project-1",
    projectTitle: "Website",
    status: OnboardingFormStatus.Open,
    submittedAt: null,
    submittedByName: null,
    completedAt: null,
    blocks: blocks.map((block, position) => ({ ...block, position })),
    answers: [],
    groupEntries: [],
    answerFiles: [],
    services: [],
    servicesConfirmed: false,
    servicesNote: null,
    editableBlockIds: blocks.map((block) => block.id),
    lastEditedAt: null,
    lastEditedByName: null,
    canSubmit: true,
    canAttach: true,
    ...overrides,
  };
}
