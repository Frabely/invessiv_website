import type { RefinementCtx } from "zod";
import { z } from "zod";
import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { leadSchema } from "@/server/workspace/leads/services/shared/lead-schema";

type LeadNameShape = { last_name?: string; company_name?: string };

function hasAtLeastOneName(data: LeadNameShape): boolean {
  return Boolean(data.last_name?.trim()) || Boolean(data.company_name?.trim());
}

function addMissingLeadNameIssue(context: RefinementCtx) {
  context.addIssue({
    code: "custom",
    message: "last_name_or_company_name_required",
    path: ["last_name"],
  });
}

export const updateLeadSchema = z
  .object({
    ...leadSchema,
    email: z.string().trim().pipe(z.email()).optional(),
    lead_status: z.enum(CONTACT_LEAD_STATUS_VALUES).optional(),
  })
  .superRefine((value, context) => {
    if (value.last_name !== undefined && value.company_name !== undefined) {
      if (!hasAtLeastOneName(value)) {
        addMissingLeadNameIssue(context);
      }
    }
  });

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
