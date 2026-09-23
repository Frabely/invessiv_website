import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { taskListOrderService } from "@/server/workspace/crm/services/task-list-order";
import { taskSchemas } from "@/server/workspace/crm/services/task-schemas";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/**
 * Every task of every readable project of one customer, in a single query — the cockpit switches
 * between projects on the client and would otherwise ask once per project. Projects outside the
 * read scope contribute no rows; the caller decides per project whether the area is shown at all.
 */
export async function listCustomerTasks(
  customerId: string,
  actor: WorkspaceActor,
): Promise<TaskDto[]> {
  if (!taskSchemas.entityId.safeParse(customerId).success) return [];

  const rows = await getDrizzleDatabaseClient()
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.project_id))
    .where(
      and(
        eq(projects.customer_id, customerId),
        crmAccessCondition.forScope(accessScope(actor, Permission.TasksRead), {
          customerId: projects.customer_id,
          projectId: projects.id,
        }),
      ),
    )
    .orderBy(...taskListOrderService.orderBy());

  return rows.map((row) => tasksMapperService.toDto(row.task));
}
