import { defineDatabaseRecord } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadEmailContactRecord = TimestampedRecord & {
  id: string;
  lead_submission_id: string;
  message: string;
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecord<LeadEmailContactRecord>()({
    columns: [
      "id",
      "lead_submission_id",
      "message",
      "created_at",
      "updated_at",
    ],
    tableName: "lead_email_contacts",
  });
