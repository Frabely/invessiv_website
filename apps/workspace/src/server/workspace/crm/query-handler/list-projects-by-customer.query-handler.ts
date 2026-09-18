import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

export async function listProjectsByCustomer(
  customerId: string,
  actor: WorkspaceActor,
): Promise<ProjectDto[]> {
  if (!projectSchemas.entityId.safeParse(customerId).success) return [];
  const rows = await getDrizzleDatabaseClient()
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.customer_id, customerId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsRead),
          {
            customerId: projects.customer_id,
            projectId: projects.id,
          },
        ),
      ),
    )
    .orderBy(desc(projects.created_at));
  return rows.map(projectMappingService.toDto);
}
