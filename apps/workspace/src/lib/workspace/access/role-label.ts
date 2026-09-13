import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";

/** System roles are shown by their translated label, never by the developer name in the database. */
export function resolveRoleLabel(
  role: Pick<RoleSummaryDto, "name" | "systemKey">,
  content: SettingsPermissionsDictionary,
): string {
  return role.systemKey ? content.systemRoles[role.systemKey].label : role.name;
}

export function resolveRoleDescription(
  role: Pick<RoleDto, "description" | "systemKey">,
  content: SettingsPermissionsDictionary,
): string | null {
  return role.systemKey
    ? content.systemRoles[role.systemKey].description
    : role.description;
}
