import type { OnboardingValueErrorCode } from "../../../constants/crm/onboarding/onboarding-value-error-codes";

export type OnboardingValueValidationResult =
  { ok: true } | { ok: false; code: OnboardingValueErrorCode };
