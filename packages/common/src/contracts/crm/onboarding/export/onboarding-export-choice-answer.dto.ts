import type { OnboardingExportAnswerKind } from "../../../../constants/crm/onboarding/onboarding-export-answer-kinds";
import type { OnboardingExportOptionDto } from "./onboarding-export-option.dto";

/** Answer of a choice, multi choice or yes/no question. */
export interface OnboardingExportChoiceAnswerDto {
  /** Discriminates the answer shape. */
  kind: typeof OnboardingExportAnswerKind.Choice;
  /** Whether several options may be selected. */
  multiple: boolean;
  /** Every option in display order, each with whether it was picked. */
  options: OnboardingExportOptionDto[];
}
