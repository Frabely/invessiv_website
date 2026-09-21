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
 * Null means the project is out of reach — an unknown id and a foreign project are the same
 * answer. An empty array means a readable project without tasks yet, which the UI has to be able
 * to tell apart. The visibility decision is the WHERE clause of the project lookup, so no task is
 * ever loaded and filtered away afterwards.
 */
export async function listProjectTasks(
  projectId: string,
  actor: WorkspaceActor,
): Promise<TaskDto[] | null> {
  if (!taskSchemas.entityId.safeParse(projectId).success) return null;

  const db = getDrizzleDatabaseClient();
  const [readableProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        crmAccessCondition.forScope(accessScope(actor, Permission.TasksRead), {
          customerId: projects.customer_id,
          projectId: projects.id,
        }),
      ),
    )
    .limit(1);
  if (!readableProject) return null;

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.project_id, readableProject.id))
    .orderBy(...taskListOrderService.orderBy());

  return rows.map(tasksMapperService.toDto);
}
