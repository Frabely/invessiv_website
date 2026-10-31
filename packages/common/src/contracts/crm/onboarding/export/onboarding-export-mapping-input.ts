import type { Locale } from "../../../i18n/locale";
import type { OnboardingFormContextDto } from "../onboarding-form-context.dto";
import type { OnboardingFormDto } from "../onboarding-form.dto";
import type { OnboardingExportFileDto } from "./onboarding-export-file.dto";

/** Form snapshot and archive outcomes used to build the export manifest. */
export type OnboardingExportMappingInput = {
  form: OnboardingFormDto;
  context: OnboardingFormContextDto;
  locale: Locale;
  exportedAt: string;
  /** Exported file per file entry (`FileAttachmentDto.id`), decided by the archive. */
  files: ReadonlyMap<string, OnboardingExportFileDto>;
};
