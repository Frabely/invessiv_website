export const TaskStatus = {
  Open: "open",
  InProgress: "in_progress",
  Done: "done",
  Cancelled: "cancelled",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TASK_STATUS_VALUES = [
  TaskStatus.Open,
  TaskStatus.InProgress,
  TaskStatus.Done,
  TaskStatus.Cancelled,
] as const;

/** Statuses that still demand action; the only ones that can be overdue. */
export const OPEN_TASK_STATUS_VALUES = [
  TaskStatus.Open,
  TaskStatus.InProgress,
] as const;
