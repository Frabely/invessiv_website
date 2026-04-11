import type { Locale } from "@/config/i18n";
import type { ContactSubmissionChannel } from "@/common/contracts/contact/keys/contact-request-kind";
import type { TimestampedRecord } from "@/common/contracts/contact/records/timestamped-record";

export type PreparedLeadSubmissionRecord = TimestampedRecord & {
  channel: ContactSubmissionChannel;
  consentAcceptedAt: Date;
  id: string;
  locale: Locale;
  requestId: string;
  submissionStartedAt?: Date;
};
