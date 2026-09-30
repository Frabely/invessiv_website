import type { OnboardingAnswerFileRefDto } from "./onboarding-answer-file-ref.dto";
import type { OnboardingAnswerDto } from "./onboarding-answer.dto";
import type { OnboardingBlockDto } from "./onboarding-block.dto";
import type { OnboardingGroupEntryDto } from "./onboarding-group-entry.dto";

/** Everything `getOnboardingCompleteness` reads; portal, CRM, submit and completion pass the same shape. */
export interface OnboardingCompletenessInput {
  /** Blocks in form order. */
  blocks: readonly OnboardingBlockDto[];
  answers: readonly OnboardingAnswerDto[];
  answerFiles: readonly OnboardingAnswerFileRefDto[];
  groupEntries: readonly OnboardingGroupEntryDto[];
  /** Whether the customer confirmed the booked services; answers a `project_services` field. */
  servicesConfirmed: boolean;
}
