import "server-only";

import { asc, eq } from "drizzle-orm";

import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { TaskListFilterOptions } from "@/common/contracts/crm/task-list-filter-options";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, projects, tasks } from "@invessiv/db/record-configuration";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import { taskListConditionsService } from "@/server/workspace/crm/services/task-list-conditions-service";

/**
 * Filter choices come from the same task visibility condition as the overview. They intentionally
 * ignore the currently selected facets, otherwise a filter could hide the control needed to change it.
 */
export async function listTaskFilterOptions(
  actor: WorkspaceActor,
  includeClosedProjects: boolean,
): Promise<TaskListFilterOptions> {
  const filters = {
    ...DEFAULT_TASK_LIST_FILTERS,
    includeClosedProjects,
    period: TaskListPeriod.All,
    status: TaskListStatusFilter.All,
  };
  const where = taskListConditionsService.build(
    filters,
    actor,
    taskDueStateService.businessToday(),
  );
  const db = getDrizzleDatabaseClient();
  const rows = await db
    .selectDistinct({
      customerId: customers.id,
      customerDisplayName: customers.display_name,
      projectId: projects.id,
      projectTitle: projects.title,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.project_id))
    .innerJoin(customers, eq(customers.id, projects.customer_id))
    .where(where)
    .orderBy(asc(customers.display_name), asc(projects.title));

  const customersById = new Map<string, { id: string; displayName: string }>();
  const projectsById = new Map<
    string,
    { customerId: string; id: string; title: string }
  >();
  for (const row of rows) {
    customersById.set(row.customerId, {
      id: row.customerId,
      displayName: row.customerDisplayName,
    });
    projectsById.set(row.projectId, {
      customerId: row.customerId,
      id: row.projectId,
      title: row.projectTitle,
    });
  }
  return {
    customers: [...customersById.values()],
    projects: [...projectsById.values()],
  };
}
