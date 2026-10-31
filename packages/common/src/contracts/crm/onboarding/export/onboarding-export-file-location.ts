import type { OnboardingExportFileUsageDto } from "./onboarding-export-file-usage.dto";

/** Where one file goes in the archive and every question that uses it. */
export type OnboardingExportFileLocation = {
  /** Folder of its only question, or the shared folder when several questions use it. */
  folder: string;
  usedIn: OnboardingExportFileUsageDto[];
};
