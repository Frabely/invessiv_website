import type { ContactRequestKind } from "@/common/constants/contact/contact-request-kind";

export type LeadSubmissionRow = {
  id: string;
  request_id: string;
  channel: ContactRequestKind;
  locale: string;
  consent_accepted_at: Date;
  submission_started_at: Date | null;
  created_at: Date;
};
