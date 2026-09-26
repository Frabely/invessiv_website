import type { PortalCompletedProjectDto } from "./portal-completed-project.dto";
import type { PortalContactDto } from "./portal-contact.dto";
import type { PortalDashboardCapabilitiesDto } from "./portal-dashboard-capabilities.dto";
import type { PortalDashboardCustomerDto } from "./portal-dashboard-customer.dto";
import type { PortalCustomerTaskDto } from "./portal-customer-task.dto";
import type { PortalProjectDto } from "./portal-project.dto";
import type { PortalTaskDto } from "./portal-task.dto";

export interface PortalDashboardDto {
  /** Company displayed in the dashboard heading; never an authorization source. */
  customer: PortalDashboardCustomerDto;
  /** Assigned workspace contact; null if their identity is unavailable. */
  contact: PortalContactDto | null;
  /** Contact's first name for the greeting; null in owner view or when absent. */
  greetingName: string | null;
  /** Current and planned projects permitted for this reader. */
  projects: PortalProjectDto[];
  /** Completed projects shown separately from current work. */
  completedProjects: PortalCompletedProjectDto[];
  /** Visible customer-side tasks, including at most 20 recently completed tasks. */
  customerTasks: PortalCustomerTaskDto[];
  /** Visible internal-side tasks; they cannot be completed from the portal. */
  ourTasks: PortalTaskDto[];
  /** Rendering rights derived from the verified reader, not from request parameters. */
  capabilities: PortalDashboardCapabilitiesDto;
}
