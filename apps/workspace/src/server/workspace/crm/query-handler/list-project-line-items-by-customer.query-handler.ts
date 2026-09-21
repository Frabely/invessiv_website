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
 * Every service of every readable project of one customer, in a single query — the cockpit
 * switches between projects on the client and would otherwise ask once per project. Projects
 * outside the read scope contribute no rows; the caller decides per project whether the area is
 * shown at all.
 */
export async function listProjectLineItemsByCustomer(
  customerId: string,
  actor: WorkspaceActor,
): Promise<ProjectLineItemDto[]> {
  if (!projectLineItemSchemas.entityId.safeParse(customerId).success) return [];

  const rows = await getDrizzleDatabaseClient()
    .select({ projectLineItem: projectLineItems })
    .from(projectLineItems)
    .innerJoin(projects, eq(projects.id, projectLineItems.project_id))
    .where(
      and(
        eq(projects.customer_id, customerId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectLineItemsRead),
          { customerId: projects.customer_id, projectId: projects.id },
        ),
      ),
    )
    .orderBy(asc(projectLineItems.created_at));

  return rows.map((row) =>
    projectLineItemsMapperService.toDto(row.projectLineItem),
  );
}
