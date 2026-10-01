import { z } from "zod";

import { SUPPORTED_LOCALES } from "@invessiv/common";
import { QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-accepted-asset-kinds";
import { QUESTIONNAIRE_CATALOG_STATUS_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_FIELD_REQUIREMENT_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_FIELD_TYPE_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import {
  QUESTIONNAIRE_CHOICE_KEY_PATTERN_SOURCE,
  QUESTIONNAIRE_KEY_PATTERN_SOURCE,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import { QUESTIONNAIRE_LIMITS as L } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QUESTIONNAIRE_PREFILL_SOURCE_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";

// Only the shape is checked here; rules across fields (types, conditions, limits, at least one
// locale) belong to `questionnaireDefinitionValidation`, which answers with a specific error code.

const requiredText = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength);

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);

const locale = z.enum(SUPPORTED_LOCALES);
const key = z.string().regex(new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE));
const version = z.int().positive();

const blockTranslations = z.partialRecord(
  locale,
  z.strictObject({
    title: requiredText(L.titleMaxLength),
    intro: optionalText(L.introMaxLength),
  }),
);

const choice = z.strictObject({
  key: z.string().regex(new RegExp(QUESTIONNAIRE_CHOICE_KEY_PATTERN_SOURCE)),
  labels: z.partialRecord(locale, requiredText(L.choiceLabelMaxLength)),
});

const fieldInput = z.strictObject({
  key,
  requirement: z.enum(QUESTIONNAIRE_FIELD_REQUIREMENT_VALUES),
  maxLength: z.int().min(1).max(L.storedValueMaxLength).nullable(),
  minItems: z.int().min(0).max(L.storedItemCountCeiling).nullable(),
  maxItems: z.int().min(1).max(L.storedItemCountCeiling).nullable(),
  acceptedAssetKinds: z
    .array(z.enum(QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES))
    .min(1)
    .refine((kinds) => new Set(kinds).size === kinds.length)
    .nullable(),
  prefillSource: z.enum(QUESTIONNAIRE_PREFILL_SOURCE_VALUES).nullable(),
  conditionFieldId: z.uuid().nullable(),
  conditionChoiceId: z.uuid().nullable(),
  translations: z.partialRecord(
    locale,
    z.strictObject({
      label: requiredText(L.labelMaxLength),
      help: optionalText(L.helpMaxLength),
    }),
  ),
  choices: z.array(choice).max(L.choicesPerField),
  expectedBlockVersion: version,
});

const templateHead = {
  title: requiredText(L.titleMaxLength),
  description: optionalText(L.templateDescriptionMaxLength),
};

export const questionnaireSchemas = {
  entityId: z.uuid(),
  createBlock: z.strictObject({
    key,
    carryOver: z.boolean(),
    translations: blockTranslations,
  }),
  updateBlock: z.strictObject({
    key,
    carryOver: z.boolean(),
    status: z.enum(QUESTIONNAIRE_CATALOG_STATUS_VALUES),
    translations: blockTranslations,
    version,
  }),
  deleteBlock: z.strictObject({ version }),
  duplicateBlock: z.strictObject({ key }),
  createField: fieldInput.extend({
    type: z.enum(QUESTIONNAIRE_FIELD_TYPE_VALUES),
    parentFieldId: z.uuid().nullable(),
  }),
  updateField: fieldInput,
  deleteField: z.strictObject({ expectedBlockVersion: version }),
  moveField: z.strictObject({
    direction: z.union([z.literal(-1), z.literal(1)]),
    expectedBlockVersion: version,
  }),
  createTemplate: z.strictObject(templateHead),
  updateTemplate: z.strictObject({
    ...templateHead,
    status: z.enum(QUESTIONNAIRE_CATALOG_STATUS_VALUES),
    blockIds: z
      .array(z.uuid())
      .max(L.blocksPerOwner)
      .refine((ids) => new Set(ids).size === ids.length),
    version,
  }),
} as const;
