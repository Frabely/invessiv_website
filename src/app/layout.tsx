import "./globals.css";
import { LanguageProvider } from "@/components/providers/language-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { VercelAnalytics } from "@/app/analytics";
import { Insights } from "@/app/insights";
import { MARKETING_ROOT_META_CONTENT } from "@/i18n/dictionaries/marketing/root-meta";
import { DEFAULT_LOCALE, SITE_NAME, SITE_URL } from "@/lib/site-metadata";

const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION ??
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: MARKETING_ROOT_META_CONTENT.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
    title: SITE_NAME,
    description: MARKETING_ROOT_META_CONTENT.openGraphDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: MARKETING_ROOT_META_CONTENT.openGraphDescription,
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html data-theme="dark" lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <body>
        <LanguageProvider initialLocale={DEFAULT_LOCALE}>
          {children}
        </LanguageProvider>
        <VercelAnalytics />
        <Insights />
      </body>
    </html>
  );
}
