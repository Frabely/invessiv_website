import type { PortalTaskDto } from "./portal-task.dto";

export interface PortalOurTaskDto extends PortalTaskDto {
  /** True when a contact of this company created the task in the portal; which contact stays internal. */
  requestedByCustomer: boolean;
  /** True when the team declined a customer-created task; only such tasks stay visible once cancelled. */
  rejected: boolean;
}
