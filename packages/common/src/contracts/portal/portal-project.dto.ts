import type { ProjectStatus } from "../../constants/crm/project-statuses";
import type { PortalProjectLeadDto } from "./portal-project-lead.dto";
import type { PortalProjectNextStepDto } from "./portal-project-next-step.dto";

export interface PortalProjectDto {
  /** Project identifier used for the dashboard's project selection. */
  id: string;
  /** Customer-visible project name. */
  title: string;
  /** Planned, active, or paused state shown to the customer. */
  status: ProjectStatus;
  /** Ordered customer-visible process labels. */
  processSteps: string[];
  /** Current label within `processSteps`. */
  currentProcessStep: string;
  /** Next announced action; null when neither label nor date is set. */
  nextStep: PortalProjectNextStepDto | null;
  /** Optional preview or live link configured for this project. */
  previewUrl: string | null;
  /** Project lead only when different from the customer's main contact. */
  projectLead: PortalProjectLeadDto | null;
}
