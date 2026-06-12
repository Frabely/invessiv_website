export const ConsentCategory = {
  Analytics: "analytics",
  Marketing: "marketing",
} as const;
export type ConsentCategory =
  (typeof ConsentCategory)[keyof typeof ConsentCategory];

export const OPTIONAL_CONSENT_CATEGORIES = [
  ConsentCategory.Analytics,
  ConsentCategory.Marketing,
] as const;

export const ConsentSignalState = {
  Granted: "granted",
  Denied: "denied",
} as const;
export type ConsentSignalState =
  (typeof ConsentSignalState)[keyof typeof ConsentSignalState];

export type ConsentChoice = Record<ConsentCategory, boolean>;

export type GoogleConsentSignals = {
  analytics_storage: ConsentSignalState;
  ad_storage: ConsentSignalState;
  ad_user_data: ConsentSignalState;
  ad_personalization: ConsentSignalState;
};

export const REJECT_ALL_CONSENT_CHOICE: ConsentChoice = {
  analytics: false,
  marketing: false,
};

export const ACCEPT_ALL_CONSENT_CHOICE: ConsentChoice = {
  analytics: true,
  marketing: true,
};

export const DEFAULT_CONSENT_CHOICE: ConsentChoice = REJECT_ALL_CONSENT_CHOICE;
