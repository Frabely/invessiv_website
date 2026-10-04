import type { PortalTaskDto } from "./portal-task.dto";

export interface PortalCustomerTaskDto extends PortalTaskDto {
  /** Version used by the customer completion flow to refresh optimistic state. */
  version: number;
  /**
   * True when this reader may take the completion back: a contact of the company ticked it off in
   * the portal and the reader holds the reopen grant. Always false for the owner view and for tasks
   * the team completed.
   */
  canReopen: boolean;
}
