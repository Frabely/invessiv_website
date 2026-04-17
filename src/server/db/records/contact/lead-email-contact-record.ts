import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";
import { defineDatabaseRecordFromTable } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadEmailContactRecord = TimestampedRecord & {
  id: string;
  lead_submission_id: string;
  message: string;
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecordFromTable<LeadEmailContactRecord>()(leadEmailContacts);
