import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadRecord = TimestampedRecord & {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  lead_status: ContactLeadStatus;
  owner?: string;
};
