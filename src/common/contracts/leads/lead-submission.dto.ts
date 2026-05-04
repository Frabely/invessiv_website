import type { ContactRequestKind } from "@/common/constants/contact/contact-request-kind";

export interface LeadSubmissionDto {
  id: string;
  requestId: string;
  channel: ContactRequestKind;
  locale: string;
  consentAcceptedAt: Date;
  submissionStartedAt: Date | null;
  createdAt: Date;
}
