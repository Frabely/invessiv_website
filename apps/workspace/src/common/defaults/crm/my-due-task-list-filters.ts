import { TASK_LIST_ASSIGNEE_ME } from "@/common/constants/crm/list/task-list-assignee";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";

/**
 * The actor's own tasks that are overdue or due within a week. The dashboard block reads with
 * these filters and links the overview with the same ones, so both always show the same tasks.
 */
export const MY_DUE_TASK_LIST_FILTERS: TaskListFilters = {
  ...DEFAULT_TASK_LIST_FILTERS,
  assignee: TASK_LIST_ASSIGNEE_ME,
  period: TaskListPeriod.DueSoon,
};

/** How many tasks the dashboard block shows at most; the overview lists the rest. */
export const MY_DUE_TASKS_LIMIT = 10;
