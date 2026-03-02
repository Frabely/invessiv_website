import "./globals.css";
import { LanguageProvider } from "@/components/providers/language-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MARKETING_ROOT_META_CONTENT } from "@/i18n/dictionaries/marketing/root-meta";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

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
  icons: {
    icon: [{ url: "/brand/icon_noText.png", type: "image/png" }],
    shortcut: ["/brand/icon_noText.png"],
    apple: [{ url: "/brand/icon_noText.png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html data-theme="dark" lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider initialLocale="en">{children}</LanguageProvider>
      </body>
    </html>
  );
}
