/** URL state of the task overview. Values are ids, modes and short filter words — never names. */
export const TaskListQueryParam = {
  Page: "page",
  Status: "status",
  Side: "side",
  Assignee: "assignee",
  Customer: "customer",
  Project: "project",
  Period: "period",
  Search: "search",
  ClosedProjects: "closedProjects",
} as const;

export type TaskListQueryParam =
  (typeof TaskListQueryParam)[keyof typeof TaskListQueryParam];

export const TASK_LIST_QUERY_PARAM_VALUES = [
  TaskListQueryParam.Page,
  TaskListQueryParam.Status,
  TaskListQueryParam.Side,
  TaskListQueryParam.Assignee,
  TaskListQueryParam.Customer,
  TaskListQueryParam.Project,
  TaskListQueryParam.Period,
  TaskListQueryParam.Search,
  TaskListQueryParam.ClosedProjects,
] as const;
