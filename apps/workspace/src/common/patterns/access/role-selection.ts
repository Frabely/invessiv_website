import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";

/**
 * Roles offered in a role picker: active non-owner roles plus inactive ones the member still holds,
 * mirroring what `PUT …/roles` accepts. The owner role has its own flow.
 */
export function selectAssignableRoles(
  roles: readonly RoleDto[],
  currentRoleIds: readonly string[],
): RoleDto[] {
  return roles.filter(
    (role) =>
      role.systemKey !== SystemRoleKey.WorkspaceOwner &&
      (role.active || currentRoleIds.includes(role.id)),
  );
}

export function selectOwnerRoleIds(roles: readonly RoleDto[]): string[] {
  return roles
    .filter((role) => role.systemKey === SystemRoleKey.WorkspaceOwner)
    .map((role) => role.id);
}

/** A new member starts with the everyday member role when it is available. */
export function selectDefaultRoleIds(roles: readonly RoleDto[]): string[] {
  return roles
    .filter(
      (role) => role.active && role.systemKey === SystemRoleKey.WorkspaceMember,
    )
    .map((role) => role.id);
}
