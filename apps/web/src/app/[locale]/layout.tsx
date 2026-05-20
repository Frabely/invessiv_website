import "../globals.css";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Insights } from "@/app/insights";
import { AppProviders } from "@/components/providers/app-providers";
import { VercelAnalytics } from "@/components/providers/vercel-analytics/vercel-analytics";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getSiteHeaderUiContent } from "@/i18n/dictionaries/marketing/site-header-ui";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";
import {
  DEFAULT_THEME,
  resolveStoredTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme/theme";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION ??
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  manifest: "/manifest.webmanifest",
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.png", type: "image/png" }],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const cookieStore = await cookies();
  const activeLocale = locale as Locale;
  const initialTheme =
    resolveStoredTheme(cookieStore.get(THEME_STORAGE_KEY)?.value) ??
    DEFAULT_THEME;
  const ui = getSiteHeaderUiContent(activeLocale);

  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          {ui.skipLinkLabel}
        </a>
        <AppProviders initialLocale={activeLocale} initialTheme={initialTheme}>
          {children}
        </AppProviders>
        <VercelAnalytics />
        <Insights />
      </body>
    </html>
  );
}
