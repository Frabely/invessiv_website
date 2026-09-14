import {
  type Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";

type RolePermissionSource = Pick<RoleDto, "active" | "id" | "permissions">;

/**
 * Mirrors the server's resolution for a preview: the union of all active selected roles, in
 * catalog order. Inactive roles grant nothing, exactly like `resolveWorkspaceActor`.
 */
export function unionRolePermissions(
  roles: readonly RolePermissionSource[],
  roleIds: readonly string[],
): Permission[] {
  const selected = new Set(roleIds);
  const granted = new Set<Permission>();

  for (const role of roles) {
    if (!role.active || !selected.has(role.id)) {
      continue;
    }
    for (const permission of role.permissions) {
      granted.add(permission);
    }
  }

  return PERMISSION_VALUES.filter((permission) => granted.has(permission));
}
