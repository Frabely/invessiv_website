import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
export type PortalDashboardTaskActions = {
  isDoneAction: (task: PortalCustomerTaskDto) => boolean;
  isPendingAction: (taskId: string) => boolean;
  onToggleAction: (task: PortalCustomerTaskDto, done: boolean) => void;
};
