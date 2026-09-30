import type { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import type { OnboardingClarificationMode } from "../../../constants/crm/onboarding/onboarding-clarification-modes";
import type { OnboardingBlockDto } from "./onboarding-block.dto";

/** A block as a step of one form, with the team's review of it. */
export interface OnboardingFormBlockDto {
  /** Step order in the form, starting at 0. */
  position: number;
  /** Review result of the team; `pending` until someone looked at the block. */
  reviewStatus: OnboardingBlockReviewStatus;
  /** How an open question gets answered; set exactly when `reviewStatus` is `clarification`. */
  clarificationMode: OnboardingClarificationMode | null;
  /** The question or remark; required together with a clarification mode. */
  reviewNote: string | null;
  /** Member who reviewed last; null while `pending`. */
  reviewedByMemberId: string | null;
  /** When the block was reviewed last; null while `pending`. */
  reviewedAt: string | null;
  /** Optimistic-concurrency counter of the review; independent of the definition's version. */
  version: number;
  /** The form's own copy of the block with its fields. */
  block: OnboardingBlockDto;
}
