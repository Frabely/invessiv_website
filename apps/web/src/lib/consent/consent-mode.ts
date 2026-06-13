import { ConsentSignalState } from "@/common/constants/consent/consent-signal-state";
import { type ConsentChoice } from "@/common/contracts/consent/consent-choice";
import { type GoogleConsentSignals } from "@/common/contracts/consent/google-consent-signals";

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
