import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";

export interface PortalNavItem {
  readonly section: PortalSection;
  /** Key into `dictionaries/portal/shell/{de,en}.json` `nav.items`. */
  readonly labelKey: PortalSection;
  readonly requiredPermission: Permission;
}

/**
 * `listPermittedPortalNavItems` (called from `portal/[customerId]/layout.tsx`) filters this by the
 * actor's permissions, so a module only has to append here — no change to the shell or the layout.
 */
export const PORTAL_NAV_ITEMS: readonly PortalNavItem[] = [
  {
    section: PortalSection.Messages,
    labelKey: PortalSection.Messages,
    requiredPermission: Permission.PortalMessagesRead,
  },
  {
    section: PortalSection.Files,
    labelKey: PortalSection.Files,
    requiredPermission: Permission.PortalFilesRead,
  },
  {
    section: PortalSection.Onboarding,
    labelKey: PortalSection.Onboarding,
    requiredPermission: Permission.PortalOnboardingRead,
  },
];
