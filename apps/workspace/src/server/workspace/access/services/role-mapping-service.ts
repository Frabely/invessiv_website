import {
  type Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import {
  SYSTEM_ROLE_KEY_VALUES,
  type SystemRoleKey,
} from "@invessiv/common/constants/auth/system-role-keys";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";
import type { RoleAssignmentCountRow } from "@invessiv/common/contracts/auth/rows/role-assignment-count-row";
import type { RolePermissionRow } from "@invessiv/common/contracts/auth/rows/role-permission-row";
import { isPermission } from "@invessiv/common/patterns/auth/can";

function systemRoleRank(systemKey: SystemRoleKey | null): number {
  return systemKey === null
    ? SYSTEM_ROLE_KEY_VALUES.length
    : SYSTEM_ROLE_KEY_VALUES.indexOf(systemKey);
}

/** System roles first in catalog order, then custom roles by name. */
function compareRoles(
  left: Pick<RoleSummaryDto, "name" | "systemKey">,
  right: Pick<RoleSummaryDto, "name" | "systemKey">,
): number {
  const rankDifference =
    systemRoleRank(left.systemKey) - systemRoleRank(right.systemKey);
  return rankDifference !== 0
    ? rankDifference
    : left.name.localeCompare(right.name);
}

function mapRowsToRoles(
  rows: readonly RolePermissionRow[],
  countRows: readonly RoleAssignmentCountRow[],
): RoleDto[] {
  const counts = new Map(
    countRows.map((row) => [row.role_id, row.assigned_member_count]),
  );
  const permissionsByRole = new Map<string, Set<Permission>>();
  const rolesById = new Map<string, RolePermissionRow>();

  for (const row of rows) {
    if (!rolesById.has(row.id)) {
      rolesById.set(row.id, row);
      permissionsByRole.set(row.id, new Set());
    }
    // Unknown keys are dropped instead of being passed on to the UI.
    if (row.permission_key !== null && isPermission(row.permission_key)) {
      permissionsByRole.get(row.id)?.add(row.permission_key);
    }
  }

  return [...rolesById.values()]
    .map((row) => {
      const granted = permissionsByRole.get(row.id) ?? new Set<Permission>();
      return {
        id: row.id,
        name: row.name,
        systemKey: row.system_key,
        active: row.active,
        scopeAssignable: row.scope_assignable === true,
        description: row.description,
        isSystem: row.is_system,
        permissions: PERMISSION_VALUES.filter((permission) =>
          granted.has(permission),
        ),
        assignedMemberCount: counts.get(row.id) ?? 0,
        version: row.version,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      };
    })
    .sort(compareRoles);
}

export const roleMappingService = {
  compareRoles,
  mapRowsToRoles,
} as const;
