import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";

export const FIXTURE_BLOCK_ID = "0b000000-0000-4000-8000-000000000001";

export function choiceFixture(
  key: string,
  overrides: Partial<QuestionnaireChoiceDto> = {},
): QuestionnaireChoiceDto {
  return {
    id: `c-${key}`,
    key,
    position: 0,
    labels: { de: key.toUpperCase(), en: key.toUpperCase() },
    version: 1,
    ...overrides,
  };
}

/** Options with positions in list order. */
export function choicesFixture(...keys: string[]): QuestionnaireChoiceDto[] {
  return keys.map((key, position) => choiceFixture(key, { position }));
}

export function fieldFixture(
  key: string,
  type: FieldType = QuestionnaireFieldType.ShortText,
  overrides: Partial<QuestionnaireFieldDto> = {},
): QuestionnaireFieldDto {
  return {
    id: `f-${key}`,
    blockId: FIXTURE_BLOCK_ID,
    parentFieldId: null,
    key,
    position: 0,
    type,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: { de: { label: key, help: null } },
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

/** A block whose fields get positions in list order. */
export function blockFixture(
  fields: QuestionnaireFieldDto[],
  overrides: Partial<QuestionnaireBlockDto> = {},
): QuestionnaireBlockDto {
  return {
    id: FIXTURE_BLOCK_ID,
    key: "company_profile",
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: { de: { title: "Unternehmen", intro: null } },
    fields: fields.map((field, position) => ({ ...field, position })),
    version: 1,
    ...overrides,
  };
}
