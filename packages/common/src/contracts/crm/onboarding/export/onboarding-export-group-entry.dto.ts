import type { OnboardingExportFieldDto } from "./onboarding-export-field.dto";

/** One repetition of a group, e.g. one team member. */
export interface OnboardingExportGroupEntryDto {
  /** Order within the group, starting at 1; also the number of the entry's file folder. */
  number: number;
  /** The group's sub-questions answered for this entry, in display order. */
  fields: OnboardingExportFieldDto[];
}
