import type { PortalTaskDto } from "./portal-task.dto";
import type { TaskStatus } from "../../constants/crm/task-statuses";

export interface PortalOurTaskDto extends PortalTaskDto {
  /** Actual workflow status; the portal uses it to label team work without exposing internal details. */
  status: TaskStatus;
  /** True when a contact of this company created the task in the portal; which contact stays internal. */
  requestedByCustomer: boolean;
}
