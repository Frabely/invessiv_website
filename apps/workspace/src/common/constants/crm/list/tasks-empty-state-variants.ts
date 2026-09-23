export const TasksEmptyStateVariant = {
  Empty: "empty",
  NoResults: "no_results",
  NothingOverdue: "nothing_overdue",
} as const;

export type TasksEmptyStateVariant =
  (typeof TasksEmptyStateVariant)[keyof typeof TasksEmptyStateVariant];

export const TASKS_EMPTY_STATE_VARIANT_VALUES = [
  TasksEmptyStateVariant.Empty,
  TasksEmptyStateVariant.NoResults,
  TasksEmptyStateVariant.NothingOverdue,
] as const;
