/**
 * Which due days the overview shows; every period but `all` means "still open and due then".
 * `due_soon` reaches from the past up to a week ahead, so it includes everything overdue.
 */
export const TaskListPeriod = {
  All: "all",
  Overdue: "overdue",
  Today: "today",
  Week: "week",
  DueSoon: "due_soon",
} as const;

export type TaskListPeriod =
  (typeof TaskListPeriod)[keyof typeof TaskListPeriod];

export const TASK_LIST_PERIOD_VALUES = [
  TaskListPeriod.All,
  TaskListPeriod.Overdue,
  TaskListPeriod.Today,
  TaskListPeriod.Week,
  TaskListPeriod.DueSoon,
] as const;
