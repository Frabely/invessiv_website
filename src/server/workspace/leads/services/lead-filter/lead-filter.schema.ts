import { z } from "zod";
import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { LEAD_SOURCES_VALUES } from "@/common/constants/leads/lead-sources";
import { LEAD_SORT_VALUES } from "@/common/constants/leads/lead-sort";

export const leadFilterSchema = z.object({
  status: z.enum(["all", ...CONTACT_LEAD_STATUS_VALUES]).optional(),
  source: z.enum(LEAD_SOURCES_VALUES).optional(),
  category: z.uuid().optional(),
  search: z.string().trim().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.number().int().min(1).optional(),
  sort: z.enum(LEAD_SORT_VALUES).optional(),
  score_min: z.number().int().min(0).max(100).optional(),
});

export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
