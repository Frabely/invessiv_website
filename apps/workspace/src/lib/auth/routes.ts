import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";

export const REDIRECT_URL_QUERY_PARAM = "redirect_url";

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
