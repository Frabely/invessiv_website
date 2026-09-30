import type { OnboardingBlockProgress } from "./onboarding-block-progress";
import type { OnboardingMissingField } from "./onboarding-missing-field";
import type { OnboardingProgressDto } from "./onboarding-progress.dto";

/** Result of `getOnboardingCompleteness`; a form may be submitted exactly when `missing` is empty. */
export interface OnboardingCompleteness extends OnboardingProgressDto {
  /** Missing fields in form order. */
  missing: readonly OnboardingMissingField[];
  /** Progress per block in form order. */
  blocks: readonly OnboardingBlockProgress[];
}
