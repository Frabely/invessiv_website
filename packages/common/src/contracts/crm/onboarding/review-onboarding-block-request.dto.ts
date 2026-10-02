import type { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import type { OnboardingClarificationMode } from "../../../constants/crm/onboarding/onboarding-clarification-modes";

/** Marks a block as not looked at or as complete; neither carries a question. */
export interface SettleOnboardingBlockReviewRequestDto {
  /** `pending` takes a review back, `complete` accepts the block as it is. */
  reviewStatus:
    | typeof OnboardingBlockReviewStatus.Pending
    | typeof OnboardingBlockReviewStatus.Complete;
  /** Review version of the block the client last read; a stale value answers with a 409. */
  expectedVersion: number;
}

/** Raises a question on a block and decides how it gets answered. */
export interface ClarifyOnboardingBlockReviewRequestDto {
  /** Always `clarification`; discriminates the request. */
  reviewStatus: typeof OnboardingBlockReviewStatus.Clarification;
  /** `customer` hands the block back to the portal, `call` keeps the question for the call. */
  clarificationMode: OnboardingClarificationMode;
  /** The question itself, at most 2 000 characters; the customer reads it when handed back. */
  note: string;
  /** Review version of the block the client last read; a stale value answers with a 409. */
  expectedVersion: number;
}

/** The team's review of one block of a submitted form. */
export type ReviewOnboardingBlockRequestDto =
  | SettleOnboardingBlockReviewRequestDto
  | ClarifyOnboardingBlockReviewRequestDto;
