export const TaskDueState = {
  Overdue: "overdue",
  DueSoon: "due_soon",
  None: "none",
} as const;

export type TaskDueState = (typeof TaskDueState)[keyof typeof TaskDueState];

/** A task counts as due soon from today up to and including this many days ahead. */
export const TASK_DUE_SOON_WINDOW_DAYS = 7;
