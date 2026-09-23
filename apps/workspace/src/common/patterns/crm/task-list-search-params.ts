import { TASK_ACTION_SIDE_VALUES } from "@invessiv/common/constants/crm/task-action-sides";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { TASK_LIST_ASSIGNEE_ME } from "@/common/constants/crm/list/task-list-assignee";
import { TASK_LIST_PERIOD_VALUES } from "@/common/constants/crm/list/task-list-periods";
import { TaskListQueryParam } from "@/common/constants/crm/list/task-list-query-params";
import { TASK_LIST_STATUS_FILTER_VALUES } from "@/common/constants/crm/list/task-list-status-filters";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import {
  type ListSearchParamsInput,
  readListPage,
  readListSearchParam,
} from "@/common/patterns/crm/list-search-params-primitives";

const SEARCH_MAX_LENGTH = 100;

function readId(value: string | undefined): string | null {
  return value !== undefined && isUuid(value) ? value : null;
}

/** Anything the URL carries that is not a known value falls back to the neutral default. */
export function parseTaskListFilters(
  searchParams: ListSearchParamsInput,
): TaskListFilters {
  const read = (param: TaskListQueryParam) =>
    readListSearchParam(searchParams[param]);
  const status = read(TaskListQueryParam.Status);
  const side = read(TaskListQueryParam.Side);
  const period = read(TaskListQueryParam.Period);
  const assignee = read(TaskListQueryParam.Assignee);

  return {
    actionSide:
      TASK_ACTION_SIDE_VALUES.find((value) => value === side) ??
      DEFAULT_TASK_LIST_FILTERS.actionSide,
    assignee: assignee === TASK_LIST_ASSIGNEE_ME ? assignee : readId(assignee),
    customerId: readId(read(TaskListQueryParam.Customer)),
    includeClosedProjects: read(TaskListQueryParam.ClosedProjects) === "true",
    page: readListPage(read(TaskListQueryParam.Page)),
    period:
      TASK_LIST_PERIOD_VALUES.find((value) => value === period) ??
      DEFAULT_TASK_LIST_FILTERS.period,
    projectId: readId(read(TaskListQueryParam.Project)),
    search: (read(TaskListQueryParam.Search) ?? "")
      .trim()
      .slice(0, SEARCH_MAX_LENGTH),
    status:
      TASK_LIST_STATUS_FILTER_VALUES.find((value) => value === status) ??
      DEFAULT_TASK_LIST_FILTERS.status,
  };
}
