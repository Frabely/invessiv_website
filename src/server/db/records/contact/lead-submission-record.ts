import type { Locale } from "@/config/i18n";
import type { ContactSubmissionChannel } from "@/common/contracts/contact/keys/contact-request-kind";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { defineDatabaseRecordFromTable } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadSubmissionRecord = TimestampedRecord & {
  channel: ContactSubmissionChannel;
  consent_accepted_at: Date;
  id: string;
  lead_id: string;
  locale: Locale;
  request_id: string;
  submission_started_at?: Date;
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecordFromTable<LeadSubmissionRecord>()(leadSubmissions);
