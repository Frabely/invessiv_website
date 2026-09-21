import "server-only";

import { count, eq } from "drizzle-orm";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, projects, tasks } from "@invessiv/db/record-configuration";
import { TASK_LIST_PAGE_SIZE } from "@/common/constants/crm/list/task-list-assignee";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import type { TaskListResult } from "@/common/contracts/crm/task-list-result";
import { taskListConditionsService } from "@/server/workspace/crm/services/task-list-conditions-service";
import { taskListOrderService } from "@/server/workspace/crm/services/task-list-order";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";

/**
 * Every task the actor may read, across customers and projects, narrowed by the filters. Two
 * queries per call — the page and the count, built from the same conditions — and no per-row
 * lookups: the customer and project names come from the same join. `today` is the business day,
 * decided once by the caller so the rows and the due-date filters agree.
 */
export async function listTasks(
  filters: TaskListFilters,
  actor: WorkspaceActor,
  today: string,
): Promise<TaskListResult> {
  const db = getDrizzleDatabaseClient();
  const where = taskListConditionsService.build(filters, actor, today);

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        task: tasks,
        customerId: projects.customer_id,
        customerDisplayName: customers.display_name,
        projectTitle: projects.title,
      })
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.project_id))
      .innerJoin(customers, eq(customers.id, projects.customer_id))
      .where(where)
      .orderBy(...taskListOrderService.orderBy())
      .limit(TASK_LIST_PAGE_SIZE)
      .offset((filters.page - 1) * TASK_LIST_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.project_id))
      .innerJoin(customers, eq(customers.id, projects.customer_id))
      .where(where),
  ]);

  return {
    page: filters.page,
    perPage: TASK_LIST_PAGE_SIZE,
    rows: rows.map((row) => ({
      task: tasksMapperService.toDto(row.task),
      customerId: row.customerId,
      customerDisplayName: row.customerDisplayName,
      projectTitle: row.projectTitle,
    })),
    total: totals?.total ?? 0,
  };
}
