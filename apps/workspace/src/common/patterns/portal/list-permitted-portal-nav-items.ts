import type { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  PORTAL_NAV_ITEMS,
  type PortalNavItem,
} from "@/common/constants/portal/portal-nav-items";

/**
 * The single filter every portal layout uses before rendering navigation. `items` defaults to
 * the live registry so a new module only has to append there — this never needs a second caller.
 */
export function listPermittedPortalNavItems(
  permissions: ReadonlySet<Permission>,
  items: readonly PortalNavItem[] = PORTAL_NAV_ITEMS,
): readonly PortalNavItem[] {
  return items.filter((item) => permissions.has(item.requiredPermission));
}
