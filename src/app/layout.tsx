import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { getRequestI18n } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "invessiv | Roadmaps und Agent-Blueprints",
  description:
    "Mehrseitige Next.js-Basis fuer Landingpages, Produktseiten und rechtliche Seiten.",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "invessiv | Roadmaps und Agent-Blueprints",
    description:
      "Mehrseitige Next.js-Basis fuer Landingpages, Produktseiten und rechtliche Seiten.",
    url: siteConfig.url,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getRequestI18n();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}
