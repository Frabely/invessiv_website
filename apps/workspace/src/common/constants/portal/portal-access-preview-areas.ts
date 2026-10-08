import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";

/**
 * Portal areas shown in the invitation preview, regardless of header navigation. Credentials have
 * no page of their own, so they are named by their dashboard widget.
 */
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
  {
    labelKey: PortalWidgetKey.Credentials,
    requiredPermission: Permission.PortalCredentialsRead,
  },
] as const;
