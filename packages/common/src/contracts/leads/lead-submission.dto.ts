import type { ContactRequestKind } from "@invessiv/common/constants/contact/contact-request-kind";

export interface LeadSubmissionDto {
  id: string;
  requestId: string;
  channel: ContactRequestKind;
  locale: string;
  consentAcceptedAt: string;
  submissionStartedAt: string | null;
  createdAt: string;
}
