import { describe, expect, it } from "vitest";

import {
  ACCEPT_ALL_CONSENT_CHOICE,
  DEFAULT_CONSENT_CHOICE,
  REJECT_ALL_CONSENT_CHOICE,
} from "@/common/defaults/consent/consent-choice";
import { DEFAULT_GOOGLE_CONSENT_SIGNALS } from "@/common/defaults/consent/google-consent-signals";
import { mapConsentChoiceToGoogleSignals } from "./consent-mode";

describe("mapConsentChoiceToGoogleSignals", () => {
  it("keeps every signal denied when both categories are rejected", () => {
    expect(mapConsentChoiceToGoogleSignals(REJECT_ALL_CONSENT_CHOICE)).toEqual({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("grants only analytics_storage when analysis is accepted", () => {
    expect(
      mapConsentChoiceToGoogleSignals({ analytics: true, marketing: false }),
    ).toEqual({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("grants all ad signals but not analytics when marketing is accepted", () => {
    expect(
      mapConsentChoiceToGoogleSignals({ analytics: false, marketing: true }),
    ).toEqual({
      analytics_storage: "denied",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("grants every signal when both categories are accepted", () => {
    expect(mapConsentChoiceToGoogleSignals(ACCEPT_ALL_CONSENT_CHOICE)).toEqual({
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("matches the consent-mode default for the default (reject) choice", () => {
    expect(mapConsentChoiceToGoogleSignals(DEFAULT_CONSENT_CHOICE)).toEqual(
      DEFAULT_GOOGLE_CONSENT_SIGNALS,
    );
  });
});
