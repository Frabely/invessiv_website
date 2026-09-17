import type { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import type { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

export interface CreateProjectRequestDto {
  /** User-facing project title. */
  title: string;
  /** Lifecycle status of the project. */
  status: ProjectStatus;
  /** Legacy workflow phase retained for the standard workflow. */
  phase: ProjectPhase;
  /** Ordered project-specific process labels. */
  processSteps: string[];
  /** Current label selected from processSteps. */
  currentProcessStep: string;
  /** Internal billing model. */
  billingModel: ProjectBillingModel;
  /** Optional preview URL. */
  previewUrl: string | null;
  /** Optional next action label. */
  nextStepLabel: string | null;
  /** Optional next action due date. */
  nextStepDueOn: string | null;
  /** Optional project start date. */
  startedOn: string | null;
  /** Optional internal budget in EUR cents. */
  budgetCents: number | null;
  /** Optional internal hourly rate in EUR cents. */
  hourlyRateCents: number | null;
}
