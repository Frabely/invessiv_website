import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";

export const SIGN_IN_PATH = SITE_ROUTES.signIn;
export const SIGN_UP_PATH = SITE_ROUTES.signUp;
export const DASHBOARD_PATH = SITE_ROUTES.dashboard;

export const REDIRECT_URL_QUERY_PARAM = "redirect_url";

export function signInPathFor(locale: Locale): string {
  return `/${locale}${SIGN_IN_PATH}`;
}

export function signUpPathFor(locale: Locale): string {
  return `/${locale}${SIGN_UP_PATH}`;
}

export function dashboardPathFor(locale: Locale): string {
  return `/${locale}${DASHBOARD_PATH}`;
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
