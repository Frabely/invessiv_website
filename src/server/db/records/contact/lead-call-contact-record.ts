import { LEAD_CALL_CONTACT_COLUMNS } from "@/server/db/record-configuration/lead-call-contacts";
import { defineDatabaseRecord } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadCallContactRecord = TimestampedRecord & {
  id: string;
  lead_submission_id: string;
  message?: string;
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecord<LeadCallContactRecord>()({
    columns: LEAD_CALL_CONTACT_COLUMNS,
    tableName: "lead_call_contacts",
  });
