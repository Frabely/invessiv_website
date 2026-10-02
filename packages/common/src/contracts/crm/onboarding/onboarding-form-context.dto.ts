import type { ProjectPhase } from "../../../constants/crm/project-phases";

/** Where a form belongs, for the head of its internal page. */
export interface OnboardingFormContextDto {
  /** Customer of the form's project; the back link opens this customer's cockpit. */
  customerId: string;
  /** Display name of the customer, not the legal company name. */
  customerName: string;
  /** The one project the form belongs to; the back link opens this project tab. */
  projectId: string;
  /** Title of the project. */
  projectTitle: string;
  /** Phase of the project right now; a completion only moves it on from `onboarding`. */
  projectPhase: ProjectPhase;
  /** Title of the template the form was started from; null when started empty or once the template was deleted. */
  templateTitle: string | null;
}
