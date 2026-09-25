import { Permission } from "@invessiv/common/constants/auth/permissions";

/** A selected role set must still exist and grant the portal entry permission. */
export function hasUsablePortalRoles(
  selectedRoleIds: readonly string[],
  rows: readonly { id: string; permission: string | null }[],
): boolean {
  const selectedIds = new Set(selectedRoleIds);
  if (selectedIds.size === 0 || selectedIds.size !== selectedRoleIds.length)
    return false;

  const availableIds = new Set(rows.map((row) => row.id));
  if (selectedRoleIds.some((id) => !availableIds.has(id))) return false;

  return rows.some(
    (row) =>
      selectedIds.has(row.id) && row.permission === Permission.PortalAccess,
  );
}
