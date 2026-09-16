import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import type { Locale } from "@/config/i18n";
import { REDIRECT_URL_QUERY_PARAM, SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";

const WORKSPACE_AREA_ROUTES: Record<WorkspaceArea, string> = {
  [WorkspaceArea.Dashboard]: SITE_ROUTES.DASHBOARD,
  [WorkspaceArea.Leads]: SITE_ROUTES.LEADS,
  [WorkspaceArea.Crm]: SITE_ROUTES.CRM,
  [WorkspaceArea.Settings]: SITE_ROUTES.SETTINGS,
};

export function workspaceAreaPathFor(
  locale: Locale,
  area: WorkspaceArea,
): string {
  return createLocalePathname(WORKSPACE_AREA_ROUTES[area], locale);
}

export function signInPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.SIGN_IN, locale);
}

export function signUpPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.SIGN_UP, locale);
}

export function workspacePathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.WORKSPACE, locale);
}

export function dashboardPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.DASHBOARD, locale);
}

export function signInPathWithRedirect(
  locale: Locale,
  redirectUrl: string,
): string {
  const params = new URLSearchParams({
    [REDIRECT_URL_QUERY_PARAM]: redirectUrl,
  });
  return `${signInPathFor(locale)}?${params.toString()}`;
}
