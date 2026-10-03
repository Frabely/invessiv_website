import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";

/** Portal areas shown in the invitation preview, regardless of header navigation. */
export const PORTAL_ACCESS_PREVIEW_AREAS = [
  {
    labelKey: PortalSection.Messages,
    requiredPermission: Permission.PortalMessagesRead,
  },
  {
    labelKey: PortalSection.Files,
    requiredPermission: Permission.PortalFilesRead,
  },
  {
    labelKey: PortalSection.Onboarding,
    requiredPermission: Permission.PortalOnboardingRead,
  },
] as const;
