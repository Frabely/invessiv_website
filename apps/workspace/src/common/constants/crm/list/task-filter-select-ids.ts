/** DOM ids of the selects that stand in for the chip rows of the task facets. */
export const TaskFilterSelectId = {
  Status: "tasks-status-filter",
  Period: "tasks-period-filter",
  Side: "tasks-side-filter",
  Assignee: "tasks-assignee-filter",
  Customer: "tasks-customer-filter",
  Project: "tasks-project-filter",
} as const;

export type TaskFilterSelectId =
  (typeof TaskFilterSelectId)[keyof typeof TaskFilterSelectId];

export const TASK_FILTER_SELECT_ID_VALUES = [
  TaskFilterSelectId.Status,
  TaskFilterSelectId.Period,
  TaskFilterSelectId.Side,
  TaskFilterSelectId.Assignee,
  TaskFilterSelectId.Customer,
  TaskFilterSelectId.Project,
] as const;
