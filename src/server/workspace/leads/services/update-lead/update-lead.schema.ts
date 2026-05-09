import { z } from "zod";
import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { LeadFieldLimits } from "@/common/constants/leads/lead-field-limits";
import { LeadValidationMessageCode } from "@/common/constants/leads/lead-form-validation";
import { leadSchema } from "@/server/workspace/leads/services/shared/lead-schema";
import {
  addMissingLeadNameIssue,
  hasAtLeastOneLeadName,
} from "@/server/workspace/leads/services/shared/lead-name-validation";
import { isValidContactPhone } from "@/common/patterns/contact/contact-phone";

const nullableTrimmedString = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();

export const updateLeadSchema = z
  .object({
    ...leadSchema,
    first_name: nullableTrimmedString(LeadFieldLimits.NameMaxLength),
    last_name: nullableTrimmedString(LeadFieldLimits.NameMaxLength),
    company_name: nullableTrimmedString(LeadFieldLimits.NameMaxLength),
    email: z.string().trim().pipe(z.email()).optional(),
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
  })
  .superRefine((value, context) => {
    if (value.last_name !== undefined && value.company_name !== undefined) {
      if (!hasAtLeastOneLeadName(value)) {
        addMissingLeadNameIssue(context);
      }
    }
  });

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
