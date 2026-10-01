import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { UpdateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-field-request.dto";

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

/** A create-field request with every optional setting empty; yes/no fields get their two fixed options. */
export function fieldRequestFixture(
  key: string,
  type: FieldType,
  expectedBlockVersion: number,
  overrides: Partial<CreateQuestionnaireFieldRequestDto> = {},
): CreateQuestionnaireFieldRequestDto {
  return {
    key,
    type,
    parentFieldId: null,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: {
      de: { label: key, help: null },
      en: { label: key, help: null },
    },
    choices:
      type === QuestionnaireFieldType.YesNo
        ? [
            { key: "yes", labels: { de: "Ja", en: "Yes" } },
            { key: "no", labels: { de: "Nein", en: "No" } },
          ]
        : [],
    expectedBlockVersion,
    ...overrides,
  };
}

/** Block-level fields and sub-fields alike, looked up by their key. */
export function fieldByKey(
  block: QuestionnaireBlockDto,
  key: string,
): QuestionnaireFieldDto {
  return block.fields
    .flatMap((field) => [field, ...field.children])
    .find((field) => field.key === key)!;
}

/** An update request: the type and the level of an existing field are fixed, so they are not sent. */
export function updateFieldRequestFixture(
  ...args: Parameters<typeof fieldRequestFixture>
): UpdateQuestionnaireFieldRequestDto {
  const input: Partial<CreateQuestionnaireFieldRequestDto> =
    fieldRequestFixture(...args);
  delete input.type;
  delete input.parentFieldId;
  return input as UpdateQuestionnaireFieldRequestDto;
}
