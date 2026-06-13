import { ConsentSignalState } from "@/common/constants/consent/consent-signal-state";
import { type ConsentChoice } from "@/common/contracts/consent/consent-choice";
import { type GoogleConsentSignals } from "@/common/contracts/consent/google-consent-signals";

export const DEFAULT_GOOGLE_CONSENT_SIGNALS: GoogleConsentSignals = {
  analytics_storage: ConsentSignalState.Denied,
  ad_storage: ConsentSignalState.Denied,
  ad_user_data: ConsentSignalState.Denied,
  ad_personalization: ConsentSignalState.Denied,
};

export const CONSENT_DEFAULT_PARAMS = {
  ads_data_redaction: true,
  url_passthrough: true,
  wait_for_update: 500,
} as const;

function toSignalState(granted: boolean): ConsentSignalState {
  return granted ? ConsentSignalState.Granted : ConsentSignalState.Denied;
}

export function mapConsentChoiceToGoogleSignals(
  choice: ConsentChoice,
): GoogleConsentSignals {
  return {
    analytics_storage: toSignalState(choice.analytics),
    ad_storage: toSignalState(choice.marketing),
    ad_user_data: toSignalState(choice.marketing),
    ad_personalization: toSignalState(choice.marketing),
  };
}
