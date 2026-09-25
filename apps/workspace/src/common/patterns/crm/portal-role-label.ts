import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { PortalRoleDto } from "@invessiv/common/contracts/crm/portal-role.dto";

export function portalRoleLabel(
  role: Pick<PortalRoleDto, "name" | "systemKey">,
  standardLabel: string,
): string {
  return role.systemKey === SystemRoleKey.PortalStandard
    ? standardLabel
    : role.name;
}
