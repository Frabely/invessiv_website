import { ConsentSignalState } from "@/common/constants/consent/consent-signal-state";
import type { GoogleConsentSignals } from "@/common/contracts/consent/google-consent-signals";

export const DEFAULT_GOOGLE_CONSENT_SIGNALS: GoogleConsentSignals = {
  analytics_storage: ConsentSignalState.Denied,
  ad_storage: ConsentSignalState.Denied,
  ad_user_data: ConsentSignalState.Denied,
  ad_personalization: ConsentSignalState.Denied,
};
