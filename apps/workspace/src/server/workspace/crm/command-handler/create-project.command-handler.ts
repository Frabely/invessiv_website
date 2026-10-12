import { insertProject } from "@/server/workspace/crm/services/insert-project";
import "server-only";

import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import { eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";

export async function createProject(
  customerId: string,
  input: CreateProjectRequestDto,
  actor: WorkspaceActor,
): Promise<ProjectDto | ProjectErrorCode> {
  const parsed = projectSchemas.create.safeParse(input);
  if (!parsed.success || !projectSchemas.entityId.safeParse(customerId).success)
    return ProjectErrorCode.ValidationError;
  if (!canOn(actor, Permission.ProjectsWrite, { customerId }))
    return ProjectErrorCode.NotFound;
  const db = getDrizzleDatabaseClient();
  const [customer] = await db
    .select({
      ownerMemberId: customers.owner_member_id,
      status: customers.status,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer) return ProjectErrorCode.NotFound;
  if (customer.status === ProjectStatus.Archived)
    return ProjectErrorCode.ValidationError;
  const data = parsed.data;
  const row = await insertProject(db, customerId, customer.ownerMemberId, data);
  return row ? projectMappingService.toDto(row) : ProjectErrorCode.NotFound;
}
