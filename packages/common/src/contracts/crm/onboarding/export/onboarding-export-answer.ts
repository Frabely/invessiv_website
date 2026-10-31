import type { OnboardingExportChoiceAnswerDto } from "./onboarding-export-choice-answer.dto";
import type { OnboardingExportConfirmationAnswerDto } from "./onboarding-export-confirmation-answer.dto";
import type { OnboardingExportFilesAnswerDto } from "./onboarding-export-files-answer.dto";
import type { OnboardingExportGroupAnswerDto } from "./onboarding-export-group-answer.dto";
import type { OnboardingExportScaleAnswerDto } from "./onboarding-export-scale-answer.dto";
import type { OnboardingExportTextAnswerDto } from "./onboarding-export-text-answer.dto";

/** The answer of one exported question, told apart by `kind`. */
export type OnboardingExportAnswer =
  | OnboardingExportTextAnswerDto
  | OnboardingExportChoiceAnswerDto
  | OnboardingExportScaleAnswerDto
  | OnboardingExportConfirmationAnswerDto
  | OnboardingExportFilesAnswerDto
  | OnboardingExportGroupAnswerDto;
