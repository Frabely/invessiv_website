export const OnboardingReviewFilter = {
  All: "all",
  Pending: "pending",
  Complete: "complete",
  Clarification: "clarification",
} as const;

export type OnboardingReviewFilter =
  (typeof OnboardingReviewFilter)[keyof typeof OnboardingReviewFilter];

export const ONBOARDING_REVIEW_FILTER_VALUES = Object.values(
  OnboardingReviewFilter,
);
