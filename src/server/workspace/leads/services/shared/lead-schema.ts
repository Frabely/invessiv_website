import { z } from "zod";
import { LeadValidationMessageCode } from "@/common/constants/leads/lead-form-validation";
import { isValidContactPhone } from "@/common/patterns/contact/contact-phone";
import { socialProfileSchema } from "@/server/workspace/leads/services/shared/lead-social-profile.schema";
import {
  leadEmailSchema,
  leadOptionalTextSchema,
  leadScoreSchema,
  leadUrlSchema,
  leadUuidSchema,
} from "@/server/workspace/leads/services/shared/lead-validation-core";
import { LeadFieldLimits } from "@/common/constants/leads/lead-field-limits";

const optionalName = leadOptionalTextSchema.refine(
  (value) =>
    value === undefined || value.length <= LeadFieldLimits.NameMaxLength,
);

export const leadSchema = {
  first_name: optionalName,
  last_name: optionalName,
  company_name: optionalName,
  email: leadEmailSchema,
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        value === undefined || value.length === 0 || isValidContactPhone(value),
      {
        message: LeadValidationMessageCode.PhoneInvalid,
      },
    ),
  website_url: leadUrlSchema.optional(),
  category_id: leadUuidSchema.optional(),
  score: leadScoreSchema.optional(),
  owner: z.string().trim().max(LeadFieldLimits.OwnerMaxLength).optional(),
  notes: z.string().trim().max(LeadFieldLimits.NotesMaxLength).optional(),
  improvements: z
    .array(z.string().trim().min(1).max(LeadFieldLimits.ImprovementMaxLength))
    .optional(),
  social_profiles: z.array(socialProfileSchema).optional(),
};
