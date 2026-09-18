import "server-only";

import { asc, eq } from "drizzle-orm";
import type { WorkspaceMemberAccessScopeDto } from "@invessiv/common/contracts/auth/workspace-member-access-scope.dto";
import { workspaceMemberScopedRoles } from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { accessScopeMappingService } from "@/server/workspace/access/services/access-scope-mapping-service";

async function listByMember(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<WorkspaceMemberAccessScopeDto[]> {
  const rows = await executor
    .select()
    .from(workspaceMemberScopedRoles)
    .where(eq(workspaceMemberScopedRoles.workspace_member_id, memberId))
    .orderBy(
      asc(workspaceMemberScopedRoles.assigned_at),
      asc(workspaceMemberScopedRoles.id),
    );
  return rows.map(accessScopeMappingService.mapRow);
}

async function listByCustomer(
  executor: AccessDatabaseExecutor,
  customerId: string,
): Promise<WorkspaceMemberAccessScopeDto[]> {
  const rows = await executor
    .select()
    .from(workspaceMemberScopedRoles)
    .where(eq(workspaceMemberScopedRoles.customer_id, customerId))
    .orderBy(
      asc(workspaceMemberScopedRoles.assigned_at),
      asc(workspaceMemberScopedRoles.id),
    );
  return rows.map(accessScopeMappingService.mapRow);
}

export const accessScopeReadService = { listByCustomer, listByMember } as const;
