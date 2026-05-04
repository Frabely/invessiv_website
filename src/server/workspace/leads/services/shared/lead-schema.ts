import { z } from "zod";
import { socialProfileSchema } from "@/server/workspace/leads/services/shared/lead-social-profile.schema";

const optionalName = z.string().trim().max(120).optional();

export const leadSchema = {
  first_name: optionalName,
  last_name: optionalName,
  company_name: optionalName,
  email: z.string().trim().pipe(z.email()),
  phone: z.string().trim().max(50).optional(),
  website_url: z.string().trim().pipe(z.url()).optional(),
  category_id: z.uuid().optional(),
  score: z.number().int().min(0).max(100).optional(),
  owner: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(5000).optional(),
  improvements: z.array(z.string().trim().min(1).max(500)).optional(),
  social_profiles: z.array(socialProfileSchema).optional(),
};
