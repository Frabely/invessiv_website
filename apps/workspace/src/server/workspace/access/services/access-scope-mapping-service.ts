import "server-only";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";
import type { WorkspaceMemberAccessScopeDto } from "@invessiv/common/contracts/auth/workspace-member-access-scope.dto";

/** The one place the customer/project scope union is built from a scoped-role row's columns. */
function scopeFromColumns(
  customerId: string,
  projectId: string | null,
): AccessScopeDto {
  return projectId === null
    ? { type: AccessScopeType.Customer, customerId }
    : { type: AccessScopeType.Project, customerId, projectId };
}

function mapRow(row: {
  id: string;
  workspace_member_id: string;
  role_id: string;
  customer_id: string;
  project_id: string | null;
  assigned_by_user_id: string;
  assigned_at: Date;
}): WorkspaceMemberAccessScopeDto {
  return {
    id: row.id,
    workspaceMemberId: row.workspace_member_id,
    roleId: row.role_id,
    scope: scopeFromColumns(row.customer_id, row.project_id),
    assignedByUserId: row.assigned_by_user_id,
    assignedAt: row.assigned_at.toISOString(),
  };
}

export const accessScopeMappingService = { mapRow, scopeFromColumns } as const;
