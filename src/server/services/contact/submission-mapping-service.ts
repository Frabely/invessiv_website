import "server-only";
import { randomUUID } from "node:crypto";
import type { Locale } from "@/config/i18n";
import type { ContactSubmissionChannel } from "@/common/contracts/contact/keys/contact-request-kind";
import type { PreparedLeadSubmissionRecord } from "@/server/db/records/contact/prepared-lead-submission-record";

export type SubmissionApiToDbMapperInput = {
  locale: Locale;
  startedAt?: Date;
};

export function mapSubmissionApiToDb(
  payload: SubmissionApiToDbMapperInput,
  requestId: string,
  channel: ContactSubmissionChannel,
  createdAt: Date,
): PreparedLeadSubmissionRecord {
  return {
    channel,
    consentAcceptedAt: createdAt,
    createdAt,
    id: randomUUID(),
    locale: payload.locale,
    requestId,
    submissionStartedAt: payload.startedAt,
    updatedAt: createdAt,
  };
}
