import { LEAD_EMAIL_CONTACT_COLUMNS } from "@/server/db/record-configuration/lead-email-contacts";
import { defineDatabaseRecord } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadEmailContactRecord = TimestampedRecord & {
  id: string;
  lead_submission_id: string;
  message: string;
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecord<LeadEmailContactRecord>()({
    columns: LEAD_EMAIL_CONTACT_COLUMNS,
    tableName: "lead_email_contacts",
  });
