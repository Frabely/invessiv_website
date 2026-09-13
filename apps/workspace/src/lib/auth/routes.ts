import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";

export const REDIRECT_URL_QUERY_PARAM = "redirect_url";

const WORKSPACE_AREA_ROUTES: Record<WorkspaceArea, string> = {
  [WorkspaceArea.Dashboard]: SITE_ROUTES.DASHBOARD,
  [WorkspaceArea.Leads]: SITE_ROUTES.LEADS,
};

export function workspaceAreaPathFor(
  locale: Locale,
  area: WorkspaceArea,
): string {
  return `/${locale}${WORKSPACE_AREA_ROUTES[area]}`;
}

export function signInPathFor(locale: Locale): string {
  return `/${locale}${SITE_ROUTES.SIGN_IN}`;
}

export function signUpPathFor(locale: Locale): string {
  return `/${locale}${SITE_ROUTES.SIGN_UP}`;
}

export function workspacePathFor(locale: Locale): string {
  return `/${locale}${SITE_ROUTES.WORKSPACE}`;
}

export function dashboardPathFor(locale: Locale): string {
  return `/${locale}${SITE_ROUTES.DASHBOARD}`;
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
