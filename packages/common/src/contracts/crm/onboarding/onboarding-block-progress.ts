/** Required-field progress of one block; drives the step indicator. */
export interface OnboardingBlockProgress {
  blockId: string;
  answeredRequired: number;
  totalRequired: number;
}
