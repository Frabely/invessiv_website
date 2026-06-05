import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/**
 * Request body for the gated deliver step
 * (`POST /api/public/generator/linkedin-post/deliver`). The actual post content
 * is NOT sent here - it lives, signed, inside `deliveryToken`. The server
 * verifies the signature and re-renders the exact post deterministically, so a
 * client can never have arbitrary content mailed to an arbitrary address.
 *
 * Two-consent model: `consentDelivery` is the required transactional consent
 * (only then is the mail sent and a lead persisted); `consentMarketing` is an
 * optional, not-preselected marketing opt-in stored as a flag.
 */
export type LinkedInPostDeliverRequestDto = {
  deliveryToken: string;
  displayName: string;
  email: string;
  consentDelivery: boolean;
  consentMarketing: boolean;
  locale: Locale;
  company: string;
};
