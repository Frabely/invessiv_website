import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";

/** The overview without any narrowing: everything that still demands action, first page. */
export const DEFAULT_TASK_LIST_FILTERS: TaskListFilters = {
  actionSide: null,
  assignee: null,
  customerId: null,
  includeClosedProjects: false,
  page: 1,
  period: TaskListPeriod.All,
  projectId: null,
  search: "",
  status: TaskListStatusFilter.Active,
};
