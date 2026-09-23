/** Who has to act next on a task; the assignee stays an internal member either way. */
export const TaskActionSide = {
  Internal: "internal",
  Customer: "customer",
} as const;

export type TaskActionSide =
  (typeof TaskActionSide)[keyof typeof TaskActionSide];

export const TASK_ACTION_SIDE_VALUES = [
  TaskActionSide.Internal,
  TaskActionSide.Customer,
] as const;
