import type { OnboardingExportAnswerKind } from "../../../../constants/crm/onboarding/onboarding-export-answer-kinds";
import type { OnboardingExportFieldDto } from "./onboarding-export-field.dto";
import type { OnboardingExportGroupEntryDto } from "./onboarding-export-group-entry.dto";

/** Answer of a repeating group, e.g. team members or references. */
export interface OnboardingExportGroupAnswerDto {
  /** Discriminates the answer shape. */
  kind: typeof OnboardingExportAnswerKind.Group;
  /**
   * The sub-questions without any answer, so they are known even when the group has no entry.
   * Their `visible` flag assumes an empty entry.
   */
  questions: OnboardingExportFieldDto[];
  /** Entries in display order with their answers. */
  entries: OnboardingExportGroupEntryDto[];
}
