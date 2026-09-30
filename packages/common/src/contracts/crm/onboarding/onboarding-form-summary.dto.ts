import type { OnboardingFormStatus } from "../../../constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingProgressDto } from "./onboarding-progress.dto";

/** Compact form state for the project area and the portal widget. */
export interface OnboardingFormSummaryDto {
  /** Form id; links to the form address this value. */
  id: string;
  /** Lifecycle state. */
  status: OnboardingFormStatus;
  /** Progress over the visible required fields. */
  progress: OnboardingProgressDto;
  /** Last submission; null before the first one. */
  submittedAt: string | null;
  /** Completion time; null until `completed`. */
  completedAt: string | null;
}
