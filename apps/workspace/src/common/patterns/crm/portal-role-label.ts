import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";

export function portalRoleLabel(
  role: Pick<PortalAccessDto["roles"][number], "name" | "systemKey">,
  standardLabel: string,
): string {
  return role.systemKey === SystemRoleKey.PortalStandard
    ? standardLabel
    : role.name;
}
