import { z } from "zod";

import { formValidationSchemas } from "@invessiv/common/patterns/validation/form-validation-schemas";
import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";

export const leadTextSchema = formValidationSchemas.trimmedText;
export const leadOptionalTextSchema = leadTextSchema.optional();
export const leadEmailSchema = formValidationSchemas.email;
export const leadUrlSchema = formValidationSchemas.url;
export const leadUuidSchema = formValidationSchemas.uuid;
export const leadScoreSchema = z.coerce
  .number()
  .int()
  .min(LeadFieldLimits.ScoreMin)
  .max(LeadFieldLimits.ScoreMax);
