import type { Locale } from "@/config/i18n";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";

export type SaveQuickContactDto = {
  consentAccepted: boolean;
  email: string;
  firstName: string;
  kind: typeof CONTACT_REQUEST_KIND.QuickContact;
  lastName: string;
  locale: Locale;
  message: string;
};
