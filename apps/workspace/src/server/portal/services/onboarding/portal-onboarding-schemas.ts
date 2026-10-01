import { z } from "zod";

import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";

const id = z.uuid().transform((value) => value.toLowerCase());
const slot = { fieldId: id, groupEntryId: id.nullable() };

// Only the shape is checked here. Whether a value fits its field decides
// `validateQuestionnaireValue` once the field is known.
const values = z
  .array(z.string().max(QUESTIONNAIRE_LIMITS.storedValueMaxLength))
  .max(1);

const choiceIds = z
  .array(id)
  .max(QUESTIONNAIRE_LIMITS.choicesPerField)
  .refine((ids) => new Set(ids).size === ids.length);

export const portalOnboardingSchemas = {
  id,
  answer: z.union([
    z.strictObject({ ...slot, values }),
    z.strictObject({ ...slot, choiceIds }),
  ]),
} as const;
