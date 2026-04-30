import type { Metadata } from "next";
import {
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/config/i18n";
import { getAuthContent } from "@/i18n/dictionaries/auth";
import {
  type AuthRouteKind,
  signInPathFor,
  signUpPathFor,
} from "@/lib/auth/routes";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

const authRoutePathByKind: Record<AuthRouteKind, (locale: Locale) => string> = {
  signIn: signInPathFor,
  signUp: signUpPathFor,
};

export function generateAuthStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateAuthMetadata(
  locale: string,
  routeKind: AuthRouteKind,
): Promise<Metadata> {
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const activeLocale = locale as Locale;
  const content = getAuthContent(activeLocale);
  const createRoutePath = authRoutePathByKind[routeKind];
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      createRoutePath(supportedLocale),
    ]),
  );

  return {
    ...createPageMetadata({
      title: content.meta[routeKind].title,
      description: content.meta[routeKind].description,
      canonicalPath: createRoutePath(activeLocale),
      languages: createLocaleAlternates(languages),
    }),
    robots: { index: false, follow: false },
  };
}
