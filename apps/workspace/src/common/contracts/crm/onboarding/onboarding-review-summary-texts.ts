/** The wording of a review summary; form head, review tab and project area share it. */
export type OnboardingReviewSummaryTexts = {
  /** `{reviewed}` of `{total}` blocks. */
  reviewed: string;
  /** Several open questions, with `{count}`. */
  clarifications: string;
  clarificationsOne: string;
  clarificationsNone: string;
};
