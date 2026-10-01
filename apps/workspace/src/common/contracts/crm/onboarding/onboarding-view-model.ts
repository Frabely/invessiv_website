import type { ProjectOnboardingDto } from "@invessiv/common/contracts/crm/onboarding/project-onboarding.dto";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";

/**
 * Onboarding of the project tab that is open in the cockpit. The page only builds it for a
 * project the actor may read; without it the section does not exist at all.
 */
export type OnboardingViewModel = {
  projectId: string;
  /** Form summary and whether a start is possible, both decided by the server. */
  state: ProjectOnboardingDto;
  /** Active templates for the start dialog; empty unless a start is possible. */
  templates: readonly QuestionnaireTemplateSummaryDto[];
  /** Page of the project's form; null while none was started. */
  formHref: string | null;
};
