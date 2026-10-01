import type { OnboardingFormSummaryDto } from "./onboarding-form-summary.dto";

/** Onboarding state of one project for the internal project area. */
export interface ProjectOnboardingDto {
  /** Project the state belongs to. */
  projectId: string;
  /** The project's form; null while no onboarding was started. */
  form: OnboardingFormSummaryDto | null;
  /** Whether this viewer may start one now: no form yet, eligible project and `projects.write`. */
  canStart: boolean;
  /** False for paused, finished and archived projects; explains a missing start action. */
  projectEligible: boolean;
  /** Whether the customer has a completed form whose company-wide answers a new form takes over. */
  prefillAvailable: boolean;
}
