import "../globals.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { VercelAnalytics } from "@/app/analytics";
import { Insights } from "@/app/insights";
import { LanguageProvider } from "@/components/providers/language-provider";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getSiteHeaderUiContent } from "@/i18n/dictionaries/marketing/site-header-ui";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

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

  const activeLocale = locale as Locale;
  const ui = getSiteHeaderUiContent(activeLocale);

  return (
    <html data-theme="dark" lang={activeLocale} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          {ui.skipLinkLabel}
        </a>
        <LanguageProvider initialLocale={activeLocale}>{children}</LanguageProvider>
        <VercelAnalytics />
        <Insights />
      </body>
    </html>
  );
}
