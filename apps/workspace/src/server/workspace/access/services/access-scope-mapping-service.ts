import "server-only";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { WorkspaceMemberAccessScopeDto } from "@invessiv/common/contracts/auth/workspace-member-access-scope.dto";

function mapRow(row: {
  id: string;
  role_id: string;
  customer_id: string;
  project_id: string | null;
  assigned_by_user_id: string;
  assigned_at: Date;
}): WorkspaceMemberAccessScopeDto {
  return {
    id: row.id,
    roleId: row.role_id,
    scope:
      row.project_id === null
        ? { type: AccessScopeType.Customer, customerId: row.customer_id }
        : {
            type: AccessScopeType.Project,
            customerId: row.customer_id,
            projectId: row.project_id,
          },
    assignedByUserId: row.assigned_by_user_id,
    assignedAt: row.assigned_at.toISOString(),
  };
}

export const accessScopeMappingService = { mapRow } as const;
