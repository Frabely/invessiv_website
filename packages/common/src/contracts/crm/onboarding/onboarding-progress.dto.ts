/** Progress over the visible required fields; always computed by `getOnboardingCompleteness`. */
export interface OnboardingProgressDto {
  /** Visible required fields that are answered. */
  answeredRequired: number;
  /** Visible required fields in total; sub-fields count once per group entry. */
  totalRequired: number;
  /** `answeredRequired / totalRequired`; 1 when nothing is required, never NaN. */
  ratio: number;
}
