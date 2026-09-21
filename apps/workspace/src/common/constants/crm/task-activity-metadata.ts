/** Marks an activity as belonging to a task, so a timeline can tell it from customer-level ones. */
export const TASK_ACTIVITY_ENTITY = "task";

/** The task fields whose change is recorded as an activity; never the free-text fields. */
export const TaskActivityField = {
  Assignee: "assignee_member_id",
  ActionSide: "action_side",
  VisibleToCustomer: "visible_to_customer",
} as const;

export type TaskActivityField =
  (typeof TaskActivityField)[keyof typeof TaskActivityField];
