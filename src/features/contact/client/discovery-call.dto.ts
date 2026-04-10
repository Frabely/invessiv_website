import type { Locale } from "@/config/i18n";
import type { ContactRequestKind } from "@/features/contact/contact-request-kind";

export type DiscoveryCallDto = {
  consentAccepted: boolean;
  email: string;
  firstName: string;
  kind: Extract<ContactRequestKind, "discovery_call">;
  lastName: string;
  locale: Locale;
  message?: string;
};
