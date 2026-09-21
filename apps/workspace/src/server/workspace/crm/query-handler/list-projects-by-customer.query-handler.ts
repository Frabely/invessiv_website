import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope, canAnywhere } from "@/common/patterns/auth/access-scope";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";

export async function listProjectsByCustomer(
  customerId: string,
  actor: WorkspaceActor,
  requiredPermission:
    | typeof Permission.ProjectsRead
    | typeof Permission.ProjectLineItemsRead = Permission.ProjectsRead,
): Promise<ProjectDto[]> {
  if (!projectSchemas.entityId.safeParse(customerId).success) return [];
  const rows = await getDrizzleDatabaseClient()
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.customer_id, customerId),
        crmAccessCondition.forScope(accessScope(actor, requiredPermission), {
          customerId: projects.customer_id,
          projectId: projects.id,
        }),
      ),
    )
    .orderBy(desc(projects.created_at));
  return rows.map(projectMappingService.toDto);
}

/**
 * The cockpit may render a project either because its general project data is readable or because
 * its services are readable. The two independently scoped grants are combined server-side, so a
 * project-line-items-only role never causes the page to load a sibling project.
 */
export async function listCockpitProjectsByCustomer(
  customerId: string,
  actor: WorkspaceActor,
): Promise<CockpitProjectDto[]> {
  const [projectRows, projectLineItemRows] = await Promise.all([
    canAnywhere(actor, Permission.ProjectsRead)
      ? listProjectsByCustomer(customerId, actor)
      : [],
    canAnywhere(actor, Permission.ProjectLineItemsRead)
      ? listProjectsByCustomer(
          customerId,
          actor,
          Permission.ProjectLineItemsRead,
        )
      : [],
  ]);

  const projectsById = new Map<string, CockpitProjectDto>(
    projectRows.map((project) => [
      project.id,
      { id: project.id, title: project.title, project },
    ]),
  );
  for (const project of projectLineItemRows) {
    if (!projectsById.has(project.id)) {
      projectsById.set(project.id, {
        id: project.id,
        title: project.title,
        project: null,
      });
    }
  }
  return [...projectsById.values()];
}
