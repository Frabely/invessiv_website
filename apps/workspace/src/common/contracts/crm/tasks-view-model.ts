import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";

/** A member a task can be assigned to; only what the picker and the row need to show a name. */
export type TaskAssigneeOption = {
  id: string;
  displayName: string;
  active: boolean;
};

/**
 * Everything the cockpit needs to render tasks for the projects of one customer. The page resolves
 * the two id lists with `canOn` per project, so a project the actor may not read is never
 * distinguishable from one without tasks.
 */
export type TasksViewModel = {
  /** Tasks of every readable project of the customer, in the order of the list query. */
  tasks: readonly TaskDto[];
  readableProjectIds: readonly string[];
  writableProjectIds: readonly string[];
  /** Empty when the actor may not list members; names and the assignee picker then stay hidden. */
  members: readonly TaskAssigneeOption[];
  /** The current calendar day in the business time zone, decided once on the server. */
  today: string;
};
