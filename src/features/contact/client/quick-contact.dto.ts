import type { Locale } from "@/config/i18n";
import type { ContactRequestKind } from "@/features/contact/contact-request-kind";

export type QuickContactDto = {
  consentAccepted: boolean;
  email: string;
  firstName: string;
  kind: Extract<ContactRequestKind, "quick_contact">;
  lastName: string;
  locale: Locale;
  message: string;
};
