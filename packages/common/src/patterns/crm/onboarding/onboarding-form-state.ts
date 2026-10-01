import { ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES } from "../../../constants/crm/onboarding/onboarding-eligible-project-statuses";
import {
  ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES,
  type OnboardingFormStatus,
} from "../../../constants/crm/onboarding/onboarding-form-statuses";
import type { ProjectStatus } from "../../../constants/crm/project-statuses";

/** Whether blocks and fields of a form may still change; the server enforces it, the UI follows. */
export function isOnboardingStructureEditable(
  status: OnboardingFormStatus,
): boolean {
  return (
    ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES as readonly OnboardingFormStatus[]
  ).includes(status);
}

/** Whether an onboarding may be started for a project in this status. */
export function isOnboardingProjectEligible(status: ProjectStatus): boolean {
  return (
    ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES as readonly ProjectStatus[]
  ).includes(status);
}
