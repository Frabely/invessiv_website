import { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "../../../constants/crm/onboarding/onboarding-clarification-modes";
import type { OnboardingBlockReviewRef } from "../../../contracts/crm/onboarding/onboarding-block-review-ref";
import type { OnboardingReviewSummary } from "../../../contracts/crm/onboarding/onboarding-review-summary";

type ReviewState = Pick<
  OnboardingBlockReviewRef,
  "reviewStatus" | "clarificationMode"
>;

/** The blocks with an open question of one way, in the order given. */
export function listOnboardingClarificationBlocks<T extends ReviewState>(
  blocks: readonly T[],
  mode: OnboardingClarificationMode,
): T[] {
  return blocks.filter(
    (block) =>
      block.reviewStatus === OnboardingBlockReviewStatus.Clarification &&
      block.clarificationMode === mode,
  );
}

/** Project area, form head and completion dialog all read the review state from here. */
export function summarizeOnboardingReview(
  blocks: readonly ReviewState[],
): OnboardingReviewSummary {
  const customerClarifications = listOnboardingClarificationBlocks(
    blocks,
    OnboardingClarificationMode.Customer,
  ).length;
  const callClarifications = listOnboardingClarificationBlocks(
    blocks,
    OnboardingClarificationMode.Call,
  ).length;
  return {
    total: blocks.length,
    reviewed: blocks.filter(
      (block) => block.reviewStatus !== OnboardingBlockReviewStatus.Pending,
    ).length,
    clarifications: customerClarifications + callClarifications,
    customerClarifications,
    callClarifications,
  };
}
