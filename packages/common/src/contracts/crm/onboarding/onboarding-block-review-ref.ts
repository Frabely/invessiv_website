import type { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import type { OnboardingClarificationMode } from "../../../constants/crm/onboarding/onboarding-clarification-modes";

/** What decides whether the customer may edit a block again after a change request. */
export interface OnboardingBlockReviewRef {
  blockId: string;
  reviewStatus: OnboardingBlockReviewStatus;
  clarificationMode: OnboardingClarificationMode | null;
}
