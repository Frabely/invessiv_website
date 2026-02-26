import "./globals.css";
import { LanguageProvider } from "@/components/providers/language-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Invessiv builds high-performance landing pages, websites, and process tools with a clear conversion focus.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
    title: SITE_NAME,
    description:
      "Landing pages, websites, and process tools with clear structure and production-ready delivery.",
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
