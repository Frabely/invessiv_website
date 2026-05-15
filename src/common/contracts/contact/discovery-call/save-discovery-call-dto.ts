import type { Locale } from "@/config/i18n";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";

export type SaveDiscoveryCallDto = {
  consentAccepted: boolean;
  email: string;
  displayName: string;
  kind: typeof CONTACT_REQUEST_KIND.DiscoveryCall;
  locale: Locale;
  message?: string;
};
