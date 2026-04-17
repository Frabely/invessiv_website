import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";
import { LEAD_COLUMNS } from "@/server/db/record-configuration/leads";
import { defineDatabaseRecord } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadRecord = TimestampedRecord & {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  lead_status: ContactLeadStatus;
  owner?: string;
};

export const DATABASE_RECORD_DEFINITION = defineDatabaseRecord<LeadRecord>()({
  columns: LEAD_COLUMNS,
  tableName: "leads",
});
