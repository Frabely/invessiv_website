import type { PortalTaskDto } from "./portal-task.dto";

export interface PortalCustomerTaskDto extends PortalTaskDto {
  /** Version used by the customer completion flow to refresh optimistic state. */
  version: number;
}
