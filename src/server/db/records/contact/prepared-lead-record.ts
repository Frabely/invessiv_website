import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type PreparedLeadRecord = TimestampedRecord & {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  leadStatus: ContactLeadStatus;
};
