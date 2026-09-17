import "server-only";

import { desc, eq } from "drizzle-orm";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";

export async function listProjectsByCustomer(
  customerId: string,
): Promise<ProjectDto[]> {
  if (!projectSchemas.entityId.safeParse(customerId).success) return [];
  const rows = await getDrizzleDatabaseClient()
    .select()
    .from(projects)
    .where(eq(projects.customer_id, customerId))
    .orderBy(desc(projects.created_at));
  return rows.map(projectMappingService.toDto);
}
