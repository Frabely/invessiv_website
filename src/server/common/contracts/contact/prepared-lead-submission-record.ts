import type { Locale } from "@/config/i18n";
import type { ContactSubmissionChannel } from "@/features/contact/contact-request-kind";
import type { TimestampedRecord } from "@/server/common/contracts/contact/timestamped-record";

export type PreparedLeadSubmissionRecord = TimestampedRecord & {
  channel: ContactSubmissionChannel;
  consentAcceptedAt: Date;
  id: string;
  locale: Locale;
  requestId: string;
  submissionStartedAt?: Date;
};
