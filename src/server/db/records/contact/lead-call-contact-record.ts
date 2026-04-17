import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";
import { defineDatabaseRecordFromTable } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadCallContactRecord = TimestampedRecord & {
  id: string;
  lead_submission_id: string;
  message?: string;
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecordFromTable<LeadCallContactRecord>()(leadCallContacts);
