import { PortalProjectPage } from "@/common/constants/portal/portal-project-pages";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";

/**
 * The feedback page of one project. Widget, project card and chat notices link through here, so
 * the URL shape exists once.
 */
export function buildPortalFeedbackPath({
  locale,
  customerId,
  projectId,
}: {
  locale: Locale;
  customerId: string;
  projectId: string;
}): string {
  return [
    createLocalePathname(SITE_ROUTES.PORTAL, locale),
    encodeURIComponent(customerId),
    PortalSection.Projects,
    encodeURIComponent(projectId),
    PortalProjectPage.Feedback,
  ].join("/");
}
