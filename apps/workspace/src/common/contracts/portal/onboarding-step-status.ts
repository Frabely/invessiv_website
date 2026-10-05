import type { OnboardingStepStatusKind } from "@/common/constants/portal/onboarding-step-status-kinds";

/** How the step track shows one block. */
export interface OnboardingStepStatus {
  kind: OnboardingStepStatusKind;
  /** Answered share of the visible questions, 0 to 1. */
  ratio: number;
  /** No required answer missing and nothing invalid: the block could be submitted as it is. */
  valid: boolean;
}
