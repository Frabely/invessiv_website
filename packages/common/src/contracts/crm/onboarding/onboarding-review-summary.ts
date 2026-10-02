/** The review state of a form in numbers, derived from the review columns of its blocks. */
export interface OnboardingReviewSummary {
  /** All blocks of the form. */
  total: number;
  /** Blocks someone looked at: `complete` or `clarification`. */
  reviewed: number;
  /** Blocks with an open question, whichever way it gets answered. */
  clarifications: number;
  /** Open questions that go back to the customer in the portal. */
  customerClarifications: number;
  /** Open questions kept for the onboarding call. */
  callClarifications: number;
}
