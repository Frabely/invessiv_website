import type { Locale } from "@/config/i18n";
import type { ContactRequestKind } from "@/common/contracts/contact/keys/contact-request-kind";

export type SaveQuickContactDto = {
  consentAccepted: boolean;
  email: string;
  firstName: string;
  kind: Extract<ContactRequestKind, "quick_contact">;
  lastName: string;
  locale: Locale;
  message: string;
};
