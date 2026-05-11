import { z } from "zod";

import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { LeadFieldLimits } from "@/common/constants/leads/forms/lead-field-limits";
import { LeadValidationMessageCode } from "@/common/constants/leads/forms/lead-form-validation";
import { isValidContactPhone } from "@/common/patterns/contact/contact-phone";
import { socialProfileSchema } from "@/server/workspace/leads/services/shared/lead-social-profile.schema";
import {
  leadEmailSchema,
  leadOptionalTextSchema,
  leadScoreSchema,
  leadUrlSchema,
  leadUuidSchema,
} from "@/server/workspace/leads/shared/lead-validation-core";

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
  lead_status: z.enum(CONTACT_LEAD_STATUS_VALUES).optional(),
};
