import { TaskListQueryParam } from "@/common/constants/crm/list/task-list-query-params";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";

/** Only what differs from the defaults ends up in the URL, so a plain overview has a plain address. */
export function buildTaskListQueryString(filters: TaskListFilters): string {
  const params = new URLSearchParams();
  const defaults = DEFAULT_TASK_LIST_FILTERS;

  if (filters.page > defaults.page) {
    params.set(TaskListQueryParam.Page, String(filters.page));
  }
  if (filters.status !== defaults.status) {
    params.set(TaskListQueryParam.Status, filters.status);
  }
  if (filters.actionSide) {
    params.set(TaskListQueryParam.Side, filters.actionSide);
  }
  if (filters.assignee) {
    params.set(TaskListQueryParam.Assignee, filters.assignee);
  }
  if (filters.customerId) {
    params.set(TaskListQueryParam.Customer, filters.customerId);
  }
  if (filters.projectId) {
    params.set(TaskListQueryParam.Project, filters.projectId);
  }
  if (filters.period !== defaults.period) {
    params.set(TaskListQueryParam.Period, filters.period);
  }
  if (filters.search) {
    params.set(TaskListQueryParam.Search, filters.search);
  }
  if (filters.includeClosedProjects) {
    params.set(TaskListQueryParam.ClosedProjects, "true");
  }

  return params.toString();
}

export function buildTaskListHref(
  basePath: string,
  filters: TaskListFilters,
): string {
  const query = buildTaskListQueryString(filters);
  return query ? `${basePath}?${query}` : basePath;
}

/** Whether the URL narrows the overview at all; pagination alone is not a filter. */
export function hasActiveTaskListFilters(filters: TaskListFilters): boolean {
  return (
    buildTaskListQueryString({
      ...filters,
      page: DEFAULT_TASK_LIST_FILTERS.page,
    }) !== ""
  );
}
