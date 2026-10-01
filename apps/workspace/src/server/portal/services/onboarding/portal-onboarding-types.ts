import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";

/** A form the portal shows to this reader, with the title of its project. */
export type PortalVisibleOnboardingForm = {
  form: OnboardingFormRow;
  projectTitle: string;
};

/** Everything the portal form DTO is made of, already decided for one reader. */
export type PortalOnboardingFormParts = {
  form: OnboardingFormDto;
  /** Locale of the request; texts missing in it fall back to another maintained one. */
  locale: Locale;
  projectTitle: string;
  editableBlockIds: readonly string[];
  canSubmit: boolean;
  /** Blocks holding answers the team wrote before the release. */
  prefilledBlockIds: ReadonlySet<string>;
  submittedByName: string | null;
  lastEditedAt: Date | null;
  lastEditedByName: string | null;
};

/** What the overview adds to the shared summary of a form. */
export type PortalOnboardingSummaryContext = {
  projectId: string;
  projectTitle: string;
  canEdit: boolean;
};
