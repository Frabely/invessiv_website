import type { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import type { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";

/** Internal project data. Financial fields must never enter a portal contract. */
export interface ProjectDto {
  /** Stable project identifier. */
  id: string;
  /** Parent customer identifier. */
  customerId: string;
  /** Responsible active workspace member. */
  ownerMemberId: string;
  /** User-facing project title. */
  title: string;
  /** Lifecycle state, independently editable from phase. */
  status: ProjectStatus;
  /** Current phase within the workflow. */
  phase: ProjectPhase;
  /** Ordered, project-specific process labels. */
  processSteps: string[];
  /** One value from processSteps that marks the current visual state. */
  currentProcessStep: string;
  /** Versioned workflow identifier. */
  workflowKey: ProjectWorkflowKey;
  /** Internal billing model. */
  billingModel: ProjectBillingModel;
  /** Included feedback rounds. */
  includedFeedbackRounds: number;
  /** Optional preview URL. */
  previewUrl: string | null;
  /** Next internal action. */
  nextStepLabel: string | null;
  /** Next action due date, ISO date only. */
  nextStepDueOn: string | null;
  /** Optional project start date, ISO date only. */
  startedOn: string | null;
  /** Internal plan budget in EUR cents. */
  budgetCents: number | null;
  /** Internal hourly rate in EUR cents. */
  hourlyRateCents: number | null;
  /** Optimistic concurrency version. */
  version: number;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
}
