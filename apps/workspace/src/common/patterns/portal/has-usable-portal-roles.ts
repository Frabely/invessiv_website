import { Permission } from "@invessiv/common/constants/auth/permissions";

/** A selected role set must still exist and grant the portal entry permission. */
export function hasUsablePortalRoles(
  selectedRoleIds: readonly string[],
  rows: readonly { id: string; permission: string | null }[],
): boolean {
  const availableIds = new Set(rows.map((row) => row.id));
  return (
    selectedRoleIds.length > 0 &&
    availableIds.size === selectedRoleIds.length &&
    selectedRoleIds.every((id) => availableIds.has(id)) &&
    rows.some((row) => row.permission === Permission.PortalAccess)
  );
}
