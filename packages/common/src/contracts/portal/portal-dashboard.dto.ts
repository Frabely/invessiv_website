import type { PortalCompletedProjectDto } from "./portal-completed-project.dto";
import type { PortalContactDto } from "./portal-contact.dto";
import type { PortalDashboardCapabilitiesDto } from "./portal-dashboard-capabilities.dto";
import type { PortalDashboardCustomerDto } from "./portal-dashboard-customer.dto";
import type { PortalFeedbackSummaryDto } from "./portal-feedback-summary.dto";
import type { PortalCustomerTaskDto } from "./portal-customer-task.dto";
import type { PortalProjectDto } from "./portal-project.dto";
import type { PortalOurTaskDto } from "./portal-our-task.dto";

export interface PortalDashboardDto {
  /** Company displayed in the dashboard heading; never an authorization source. */
  customer: PortalDashboardCustomerDto;
  /** Assigned workspace contact; null if their identity is unavailable. */
  contact: PortalContactDto | null;
  /**
   * Id of the selected current project, also without the project read grant: project-bound
   * actions such as creating a task address it. Null when the company has no current project.
   */
  selectedProjectId: string | null;
  /** Selected current project details; null without the project read grant. */
  project: PortalProjectDto | null;
  /** Completed projects shown separately from current work. */
  completedProjects: PortalCompletedProjectDto[];
  /** Visible customer-side tasks, including at most 20 recently completed tasks. */
  customerTasks: PortalCustomerTaskDto[];
  /** Visible internal-side tasks, plus the most recent customer-created ones the team declined. */
  ourTasks: PortalOurTaskDto[];
  /** Feedback of the selected current project; null without its read grant, selection, or round steps. */
  feedback: PortalFeedbackSummaryDto | null;
  /** Rendering rights derived from the verified reader, not from request parameters. */
  capabilities: PortalDashboardCapabilitiesDto;
}
