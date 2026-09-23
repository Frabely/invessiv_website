import "server-only";

import { count, eq } from "drizzle-orm";

import { resolveListPage } from "@invessiv/common/patterns/pagination/resolve-list-page";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, projects, tasks } from "@invessiv/db/record-configuration";
import { TASK_LIST_PAGE_SIZE } from "@/common/constants/crm/list/task-list-assignee";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import type { TaskListResult } from "@/common/contracts/crm/task-list-result";
import { taskListConditionsService } from "@/server/workspace/crm/services/task-list-conditions-service";
import { taskListRowsService } from "@/server/workspace/crm/services/task-list-rows-service";

/**
 * Every task the actor may read, across customers and projects, narrowed by the filters. The
 * count runs first so an out-of-range page clamps to the last one instead of coming back empty;
 * no per-row lookups: the customer and project names come from the same join. `today` is the
 * business day, decided once by the caller so the rows and the due-date filters agree.
 */
export async function listTasks(
  filters: TaskListFilters,
  actor: WorkspaceActor,
  today: string,
): Promise<TaskListResult> {
  const db = getDrizzleDatabaseClient();
  const where = taskListConditionsService.build(filters, actor, today);

  const [totals] = await db
    .select({ total: count() })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.project_id))
    .innerJoin(customers, eq(customers.id, projects.customer_id))
    .where(where);
  const total = totals?.total ?? 0;
  const { offset, page } = resolveListPage({
    perPage: TASK_LIST_PAGE_SIZE,
    requestedPage: filters.page,
    total,
  });
  const rows = await taskListRowsService.select(db, where, {
    limit: TASK_LIST_PAGE_SIZE,
    offset,
  });

  return { page, perPage: TASK_LIST_PAGE_SIZE, rows, total };
}
