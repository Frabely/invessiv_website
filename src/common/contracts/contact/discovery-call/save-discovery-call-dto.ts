import type { Locale } from "@/config/i18n";
import type { ContactRequestKind } from "@/common/contracts/contact/keys/contact-request-kind";

export type SaveDiscoveryCallDto = {
  consentAccepted: boolean;
  email: string;
  firstName: string;
  kind: Extract<ContactRequestKind, "discovery_call">;
  lastName: string;
  locale: Locale;
  message?: string;
};
