import type { ConsentSignalState } from "@/common/constants/consent/consent-signal-state";

export type GoogleConsentSignals = {
  analytics_storage: ConsentSignalState;
  ad_storage: ConsentSignalState;
  ad_user_data: ConsentSignalState;
  ad_personalization: ConsentSignalState;
};
