import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import type { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import type { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";

/** What the URL of the task overview asks for; every field has a neutral default. */
export type TaskListFilters = {
  /** Null for both sides. */
  actionSide: TaskActionSide | null;
  /** A member id, `TASK_LIST_ASSIGNEE_ME`, or null for every assignee. */
  assignee: string | null;
  customerId: string | null;
  /** Also list tasks of archived customers and of completed, cancelled or archived projects. */
  includeClosedProjects: boolean;
  page: number;
  period: TaskListPeriod;
  projectId: string | null;
  search: string;
  status: TaskListStatusFilter;
};
