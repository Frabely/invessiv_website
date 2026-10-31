import type { OnboardingExportAnswerKind } from "../../../../constants/crm/onboarding/onboarding-export-answer-kinds";

/**
 * Answer of a confirmation box or of the service confirmation. The confirmed services themselves
 * stand in `OnboardingExportDto.services`.
 */
export interface OnboardingExportConfirmationAnswerDto {
  /** Discriminates the answer shape. */
  kind: typeof OnboardingExportAnswerKind.Confirmation;
  /** Whether the customer confirmed. */
  confirmed: boolean;
}
