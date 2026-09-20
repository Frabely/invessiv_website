import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";
import type { WorkspaceMemberRoleRow } from "@invessiv/common/contracts/auth/rows/workspace-member-role-row";
import type { WorkspaceMemberScopedRoleRow } from "@invessiv/common/contracts/auth/rows/workspace-member-scoped-role-row";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { roleMappingService } from "@/server/workspace/access/services/role-mapping-service";

type ScopedRoleSummary = { count: number; hasActiveRole: boolean };

function summarizeScopedRoles(
  rows: readonly WorkspaceMemberScopedRoleRow[],
): Map<string, ScopedRoleSummary> {
  const summaries = new Map<string, ScopedRoleSummary>();
  for (const row of rows) {
    const summary = summaries.get(row.workspace_member_id) ?? {
      count: 0,
      hasActiveRole: false,
    };
    summary.count += 1;
    summary.hasActiveRole ||= row.role_active;
    summaries.set(row.workspace_member_id, summary);
  }
  return summaries;
}

/** Keeps the row order of the query, so the caller decides how members are sorted. */
function mapRowsToMembers(
  rows: readonly WorkspaceMemberRoleRow[],
  scopedRoleRows: readonly WorkspaceMemberScopedRoleRow[] = [],
): WorkspaceMemberDto[] {
  const scopedRoles = summarizeScopedRoles(scopedRoleRows);
  const members = new Map<string, WorkspaceMemberDto>();

  for (const row of rows) {
    let member = members.get(row.member_id);
    if (!member) {
      const scoped = scopedRoles.get(row.member_id);
      member = {
        id: row.member_id,
        userId: row.user_id,
        displayName: row.display_name,
        primaryEmail: row.primary_email,
        active: row.member_active,
        isOwner: false,
        hasActiveRole: scoped?.hasActiveRole ?? false,
        accessScopeCount: scoped?.count ?? 0,
        roles: [],
        version: row.member_version,
        createdAt: row.member_created_at.toISOString(),
      };
      members.set(row.member_id, member);
    }

    if (row.role_id === null || row.role_name === null) {
      continue;
    }
    if (row.role_active === true) {
      member.hasActiveRole = true;
    }
    if (row.role_system_key === SystemRoleKey.WorkspaceOwner) {
      member.isOwner = true;
      continue;
    }

    const role: RoleSummaryDto = {
      id: row.role_id,
      name: row.role_name,
      systemKey: row.role_system_key,
      active: row.role_active === true,
    };
    member.roles.push(role);
  }

  return [...members.values()].map((member) => ({
    ...member,
    roles: [...member.roles].sort(roleMappingService.compareRoles),
  }));
}

export const workspaceMemberMappingService = {
  mapRowsToMembers,
} as const;
