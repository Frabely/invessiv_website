import type { ConsentChoice } from "@/common/contracts/consent/consent-choice";

export const REJECT_ALL_CONSENT_CHOICE: ConsentChoice = {
  analytics: false,
  marketing: false,
};

export const ACCEPT_ALL_CONSENT_CHOICE: ConsentChoice = {
  analytics: true,
  marketing: true,
};

export const DEFAULT_CONSENT_CHOICE: ConsentChoice = REJECT_ALL_CONSENT_CHOICE;
