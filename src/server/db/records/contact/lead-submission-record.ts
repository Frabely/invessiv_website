import type { Locale } from "@/config/i18n";
import type { ContactSubmissionChannel } from "@/common/contracts/contact/keys/contact-request-kind";
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
