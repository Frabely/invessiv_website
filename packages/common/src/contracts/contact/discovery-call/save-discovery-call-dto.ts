import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import type { ContactProjectScope } from "@invessiv/common/constants/contact/contact-project-scopes";
import type { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";

export type SaveDiscoveryCallDto = {
  consentAccepted: boolean;
  email: string;
  displayName: string;
  kind: typeof CONTACT_REQUEST_KIND.DiscoveryCall;
  locale: Locale;
  message?: string;
  origin: ContactSubmissionOrigin;
  projectScope?: ContactProjectScope;
};
