import type { OnboardingExportAnswerKind } from "../../../../constants/crm/onboarding/onboarding-export-answer-kinds";

/** Answer of a text, e-mail, phone, URL or color question. */
export interface OnboardingExportTextAnswerDto {
  /** Discriminates the answer shape. */
  kind: typeof OnboardingExportAnswerKind.Text;
  /** The text as entered, a color as hex value; null when empty or only whitespace. */
  value: string | null;
}
