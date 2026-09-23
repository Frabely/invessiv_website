import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { TaskListRowDto } from "@/common/contracts/crm/task-list-result";
import {
  MY_DUE_TASK_LIST_FILTERS,
  MY_DUE_TASKS_LIMIT,
} from "@/common/defaults/crm/my-due-task-list-filters";
import { taskListConditionsService } from "@/server/workspace/crm/services/task-list-conditions-service";
import { taskListRowsService } from "@/server/workspace/crm/services/task-list-rows-service";

/**
 * The actor's own overdue and soon-due tasks, overdue first. One query without a count: the
 * dashboard only needs the first few, and the overview it links to counts the rest.
 */
export async function listMyDueTasks(
  actor: WorkspaceActor,
  today: string,
): Promise<TaskListRowDto[]> {
  return taskListRowsService.select(
    getDrizzleDatabaseClient(),
    taskListConditionsService.build(MY_DUE_TASK_LIST_FILTERS, actor, today),
    { limit: MY_DUE_TASKS_LIMIT, offset: 0 },
  );
}
