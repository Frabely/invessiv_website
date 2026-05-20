import { z } from "zod";
import { CONTACT_LEAD_STATUS_VALUES } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";
import { LeadValidationMessageCode } from "@invessiv/common/constants/leads/forms/lead-form-validation";
import { leadSchema } from "@/server/workspace/leads/shared/lead-schema";
import { isValidContactPhone } from "@invessiv/common/patterns/contact/contact-phone";

const nullableTrimmedString = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();

export const updateLeadSchema = z.object({
  ...leadSchema,
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(LeadFieldLimits.NameMaxLength)
    .optional(),
  first_name: nullableTrimmedString(LeadFieldLimits.NameMaxLength),
  last_name: nullableTrimmedString(LeadFieldLimits.NameMaxLength),
  company_name: nullableTrimmedString(LeadFieldLimits.NameMaxLength),
  email: z.string().trim().pipe(z.email()).nullable().optional(),
  phone: z
    .string()
    .trim()
    .refine((value) => isValidContactPhone(value), {
      message: LeadValidationMessageCode.PhoneInvalid,
    })
    .nullable()
    .optional(),
  website_url: z.string().trim().pipe(z.url()).nullable().optional(),
  category_id: z.string().trim().pipe(z.uuid()).nullable().optional(),
  score: z
    .number()
    .int()
    .min(LeadFieldLimits.ScoreMin)
    .max(LeadFieldLimits.ScoreMax)
    .nullable()
    .optional(),
  owner: nullableTrimmedString(LeadFieldLimits.OwnerMaxLength),
  notes: nullableTrimmedString(LeadFieldLimits.NotesMaxLength),
  lead_status: z.enum(CONTACT_LEAD_STATUS_VALUES).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
