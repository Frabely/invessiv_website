import { z } from "zod";

import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";

export const leadTextSchema = z.string().trim();
export const leadOptionalTextSchema = leadTextSchema.optional();
export const leadEmailSchema = z.string().trim().pipe(z.email());
export const leadUrlSchema = z.string().trim().pipe(z.url());
export const leadUuidSchema = z.string().trim().pipe(z.uuid());
export const leadScoreSchema = z.coerce
  .number()
  .int()
  .min(LeadFieldLimits.ScoreMin)
  .max(LeadFieldLimits.ScoreMax);
