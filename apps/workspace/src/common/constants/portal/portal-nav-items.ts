import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalSection } from "@/common/constants/portal/portal-sections";

export interface PortalNavItem {
  readonly section: PortalSection;
  /** Key into `dictionaries/portal/shell/{de,en}.json` `nav.items`. */
  readonly labelKey: PortalSection;
  readonly requiredPermission: Permission;
}

/**
 * Empty until the first portal module (Ordner 13 onward) registers its entry.
 * `listPermittedPortalNavItems` (called from `portal/[customerId]/layout.tsx`) already filters
 * this by the actor's permissions, so a module only has to append here — no change to the shell
 * or the layout.
 */
export const PORTAL_NAV_ITEMS: readonly PortalNavItem[] = [];
