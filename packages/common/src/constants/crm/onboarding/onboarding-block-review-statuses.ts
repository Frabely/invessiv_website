export const OnboardingBlockReviewStatus = {
  Pending: "pending",
  Complete: "complete",
  Clarification: "clarification",
} as const;

export type OnboardingBlockReviewStatus =
  (typeof OnboardingBlockReviewStatus)[keyof typeof OnboardingBlockReviewStatus];

export const ONBOARDING_BLOCK_REVIEW_STATUS_VALUES = [
  OnboardingBlockReviewStatus.Pending,
  OnboardingBlockReviewStatus.Complete,
  OnboardingBlockReviewStatus.Clarification,
] as const;
