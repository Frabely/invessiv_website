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
  groupEntry: z.strictObject({ id, fieldId: id }),
  moveGroupEntry: z.strictObject({
    direction: z.union([z.literal(-1), z.literal(1)]),
  }),
  attachFile: z.strictObject({ ...slot, fileId: id }),
  // A remark is stored trimmed; one without text is no remark and is rejected, not dropped.
  confirmServices: z.strictObject({
    confirmed: z.literal(true),
    note: z
      .string()
      .trim()
      .min(1)
      .max(QUESTIONNAIRE_LIMITS.noteMaxLength)
      .nullable(),
  }),
} as const;
