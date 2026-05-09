import { z } from "zod";

import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";

export const LeadBulkAction = {
  SetStatus: "set_status",
  Archive: "archive",
} as const;

export type LeadBulkAction =
  (typeof LeadBulkAction)[keyof typeof LeadBulkAction];

export const leadBulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(LeadBulkAction.SetStatus),
    ids: z.array(z.string()).min(1),
    status: z.enum(CONTACT_LEAD_STATUS_VALUES),
  }),
  z.object({
    action: z.literal(LeadBulkAction.Archive),
    ids: z.array(z.string()).min(1),
  }),
]);
