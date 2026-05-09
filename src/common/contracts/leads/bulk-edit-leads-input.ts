import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

export interface BulkEditLeadsInput {
  ids: string[];
  status: ContactLeadStatus;
}
