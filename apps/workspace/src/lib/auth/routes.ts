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

/** The company-picker entry point; a specific company's portal has its own path builder. */
export function portalEntryPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.PORTAL, locale);
}

/** The active company is always a path segment and is verified again by the portal gate. */
export function portalPathFor(locale: Locale, customerId: string): string {
  return `${portalEntryPathFor(locale)}/${encodeURIComponent(customerId)}`;
}

export function dashboardPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.DASHBOARD, locale);
}

export function crmLineItemTemplatesPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.CRM_LINE_ITEM_TEMPLATES, locale);
}

export function crmTasksPathFor(locale: Locale): string {
  return createLocalePathname(SITE_ROUTES.CRM_TASKS, locale);
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
