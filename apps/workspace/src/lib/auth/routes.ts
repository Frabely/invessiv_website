import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import type { PortalSection } from "@/common/constants/portal/portal-sections";
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

/** Public, single-use invitation path. The token is opaque and never logged by callers. */
export function portalInvitePathFor(locale: Locale, token: string): string {
  return `${createLocalePathname(SITE_ROUTES.PORTAL_INVITE, locale)}/${encodeURIComponent(token)}`;
}

/**
 * The active company is always a path segment and is verified again by the portal gate. A
 * section is only ever a fixed slug from `PortalSection`, so it needs no encoding.
 */
export function portalPathFor(
  locale: Locale,
  customerId: string,
  section?: PortalSection,
): string {
  const basePath = `${portalEntryPathFor(locale)}/${encodeURIComponent(customerId)}`;
  return section ? `${basePath}/${section}` : basePath;
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

export function signUpPathWithRedirect(
  locale: Locale,
  redirectUrl: string,
): string {
  const params = new URLSearchParams({
    [REDIRECT_URL_QUERY_PARAM]: redirectUrl,
  });
  return `${signUpPathFor(locale)}?${params.toString()}`;
}
