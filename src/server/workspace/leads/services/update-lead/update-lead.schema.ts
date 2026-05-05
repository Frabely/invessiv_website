import { z } from "zod";
import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { leadSchema } from "@/server/workspace/leads/services/shared/lead-schema";
import {
  addMissingLeadNameIssue,
  hasAtLeastOneLeadName,
} from "@/server/workspace/leads/services/shared/lead-name-validation";

export const updateLeadSchema = z
  .object({
    ...leadSchema,
    email: z.string().trim().pipe(z.email()).optional(),
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
