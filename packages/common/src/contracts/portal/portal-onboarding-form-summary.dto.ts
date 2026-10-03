import type { OnboardingFormStatus } from "../../constants/crm/onboarding/onboarding-form-statuses";
import type { QuestionnaireProgressDto } from "../crm/questionnaire/questionnaire-progress.dto";

/** Summary of one released onboarding form for the portal widget and submit response. */
export interface PortalOnboardingFormSummaryDto {
  /** Form id; the link to the form addresses this value. */
  id: string;
  /** Project the form belongs to. */
  projectId: string;
  /** Project title shown in the widget. */
  projectTitle: string;
  /** Lifecycle state; never `draft`. */
  status: OnboardingFormStatus;
  /** Progress over the visible required fields. */
  progress: QuestionnaireProgressDto;
  /** Last submission; null before the first one. */
  submittedAt: string | null;
  /** Completion time; null until `completed`. */
  completedAt: string | null;
  /** Whether this reader may write answers right now; decides between continuing and viewing. */
  canEdit: boolean;
}
