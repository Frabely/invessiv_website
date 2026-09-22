import "server-only";

import { eq, type SQL } from "drizzle-orm";

import type { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, projects, tasks } from "@invessiv/db/record-configuration";
import type { TaskListRowDto } from "@/common/contracts/crm/task-list-result";
import { taskListOrderService } from "@/server/workspace/crm/services/task-list-order";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

/** One page of task rows in the shared list order, with customer and project names from the same join. */
async function select(
  db: Database,
  where: SQL | undefined,
  page: { limit: number; offset: number },
): Promise<TaskListRowDto[]> {
  const rows = await db
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
    .limit(page.limit)
    .offset(page.offset);

  return rows.map((row) => ({
    task: tasksMapperService.toDto(row.task),
    customerId: row.customerId,
    customerDisplayName: row.customerDisplayName,
    projectTitle: row.projectTitle,
  }));
}

export const taskListRowsService = { select } as const;
