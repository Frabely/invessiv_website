/**
 * The status facet of the overview. `active` is the default and means every task that still
 * demands action (`open` and `in_progress`); the other values name exactly one status or all.
 */
export const TaskListStatusFilter = {
  Active: "active",
  Open: "open",
  InProgress: "in_progress",
  Done: "done",
  Cancelled: "cancelled",
  All: "all",
} as const;

export type TaskListStatusFilter =
  (typeof TaskListStatusFilter)[keyof typeof TaskListStatusFilter];

export const TASK_LIST_STATUS_FILTER_VALUES = [
  TaskListStatusFilter.Active,
  TaskListStatusFilter.Open,
  TaskListStatusFilter.InProgress,
  TaskListStatusFilter.Done,
  TaskListStatusFilter.Cancelled,
  TaskListStatusFilter.All,
] as const;
