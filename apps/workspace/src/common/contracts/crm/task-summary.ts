/** How much work is still waiting across a set of tasks, as the cockpit shows it at a glance. */
export type TaskSummary = {
  /** Tasks that still demand action. */
  open: number;
  /** Open tasks whose due date lies before the business day. */
  overdue: number;
};
