import type { OnboardingExportAnswerKind } from "../../../../constants/crm/onboarding/onboarding-export-answer-kinds";

/** Answer of a scale question between two labelled poles. */
export interface OnboardingExportScaleAnswerDto {
  /** Discriminates the answer shape. */
  kind: typeof OnboardingExportAnswerKind.Scale;
  /** Picked step from 1 to `steps`; null while unanswered. */
  value: number | null;
  /** Number of steps; 1 sits at `lowLabel`, `steps` at `highLabel`. */
  steps: number;
  /** Label of step 1; empty when the field has no such option. */
  lowLabel: string;
  /** Label of the last step; empty when the field has no such option. */
  highLabel: string;
}
