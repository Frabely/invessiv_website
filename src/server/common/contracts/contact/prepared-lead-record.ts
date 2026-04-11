import type { ContactLeadStatus } from "@/server/config/contact-lead-storage";
import type { TimestampedRecord } from "@/server/common/contracts/contact/timestamped-record";

export type PreparedLeadRecord = TimestampedRecord & {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  leadStatus: ContactLeadStatus;
};
