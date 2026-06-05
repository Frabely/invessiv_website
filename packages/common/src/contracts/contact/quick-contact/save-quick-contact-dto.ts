import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import type { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";

export type SaveQuickContactDto = {
  consentAccepted: boolean;
  email: string;
  displayName: string;
  kind: typeof CONTACT_REQUEST_KIND.QuickContact;
  locale: Locale;
  message: string;
  origin?: ContactSubmissionOrigin;
};
