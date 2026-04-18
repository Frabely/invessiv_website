import "server-only";
import { randomUUID } from "node:crypto";
import type { Locale } from "@/config/i18n";
import type { ContactSubmissionChannel } from "@/common/contracts/contact/keys/contact-request-kind";
import type { ContactLeadSubmissionPersistRecord } from "@/server/db/contracts/contact/contact-lead-submission-persist-record";

export type SubmissionApiToDbMapperInput = {
  locale: Locale;
  startedAt?: Date;
};

export function mapSubmissionApiToDb(
  payload: SubmissionApiToDbMapperInput,
  requestId: string,
  channel: ContactSubmissionChannel,
  leadId: string,
  createdAt: Date,
): ContactLeadSubmissionPersistRecord {
  return {
    channel,
    consent_accepted_at: createdAt,
    created_at: createdAt,
    id: randomUUID(),
    lead_id: leadId,
    locale: payload.locale,
    request_id: requestId,
    submission_started_at: payload.startedAt,
    updated_at: createdAt,
  };
}
