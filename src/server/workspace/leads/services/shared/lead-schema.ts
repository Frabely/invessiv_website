import { z } from "zod";
import { LeadFieldLimits } from "@/common/constants/leads/lead-field-limits";
import { socialProfileSchema } from "@/server/workspace/leads/services/shared/lead-social-profile.schema";

const optionalName = z
  .string()
  .trim()
  .max(LeadFieldLimits.NameMaxLength)
  .optional();

export const leadSchema = {
  first_name: optionalName,
  last_name: optionalName,
  company_name: optionalName,
  email: z.string().trim().pipe(z.email()),
  phone: z.string().trim().max(LeadFieldLimits.PhoneMaxLength).optional(),
  website_url: z.string().trim().pipe(z.url()).optional(),
  category_id: z.uuid().optional(),
  score: z
    .number()
    .int()
    .min(LeadFieldLimits.ScoreMin)
    .max(LeadFieldLimits.ScoreMax)
    .optional(),
  owner: z.string().trim().max(LeadFieldLimits.OwnerMaxLength).optional(),
  notes: z.string().trim().max(LeadFieldLimits.NotesMaxLength).optional(),
  improvements: z
    .array(z.string().trim().min(1).max(LeadFieldLimits.ImprovementMaxLength))
    .optional(),
  social_profiles: z.array(socialProfileSchema).optional(),
};
