import type { Metadata } from "next";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { getAuthContent } from "@/i18n/dictionaries/auth";
import { signInPathFor, signUpPathFor } from "@/lib/auth/routes";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

export const AuthRouteKind = {
  SignIn: "signIn",
  SignUp: "signUp",
} as const;

export type AuthRouteKind = (typeof AuthRouteKind)[keyof typeof AuthRouteKind];

const authRoutePathByKind: Record<AuthRouteKind, (locale: Locale) => string> = {
  [AuthRouteKind.SignIn]: signInPathFor,
  [AuthRouteKind.SignUp]: signUpPathFor,
};

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
