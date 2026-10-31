import type { OnboardingExportAnswerKind } from "../../../../constants/crm/onboarding/onboarding-export-answer-kinds";
import type { OnboardingExportFileDto } from "./onboarding-export-file.dto";

/** Answer of a files question. */
export interface OnboardingExportFilesAnswerDto {
  /** Discriminates the answer shape. */
  kind: typeof OnboardingExportAnswerKind.Files;
  /** Attached files in display order; those the exporting member may not open come last. */
  files: OnboardingExportFileDto[];
}
