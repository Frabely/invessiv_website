import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projectLineItems, projects } from "@invessiv/db/record-configuration";
import { accessScope } from "@/common/patterns/auth/access-scope";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { projectLineItemSchemas } from "@/server/workspace/crm/services/project-line-item-schemas";
import { projectLineItemsMapperService } from "@/server/workspace/crm/services/project-line-items-mapper-service";

/**
 * Null means the project is out of reach — an unknown id and a foreign project are the same
 * answer. An empty array means a readable project without services yet, which the UI has to be
 * able to tell apart. The visibility decision is the WHERE clause of the project lookup, so no
 * row is ever loaded and filtered away afterwards.
 *
 * Ordered oldest first, so a project reads like a growing statement instead of reshuffling
 * whenever a service is added.
 */
export async function listProjectLineItems(
  projectId: string,
  actor: WorkspaceActor,
): Promise<ProjectLineItemDto[] | null> {
  if (!projectLineItemSchemas.entityId.safeParse(projectId).success)
    return null;

  const db = getDrizzleDatabaseClient();
  const [readableProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectLineItemsRead),
          { customerId: projects.customer_id, projectId: projects.id },
        ),
      ),
    )
    .limit(1);
  if (!readableProject) return null;

  const rows = await db
    .select()
    .from(projectLineItems)
    .where(eq(projectLineItems.project_id, readableProject.id))
    .orderBy(asc(projectLineItems.created_at));

  return rows.map(projectLineItemsMapperService.toDto);
}
