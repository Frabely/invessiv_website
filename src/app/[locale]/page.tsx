import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingHomePageClient } from "@/components/marketing/home/marketing-home-page-client";
import { SITE_URL } from "@/lib/site-metadata";

const SUPPORTED_LOCALES = ["de", "en"] as const;

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    return {};
  }

  const isGerman = locale === "de";
  const title = isGerman
    ? "Landingpages, Webseiten und Prozess-Tools"
    : "Landing pages, websites and process tools";
  const description = isGerman
    ? "Invessiv entwickelt Landingpages, Webseiten und Prozess-Tools mit klarem Fokus auf Conversion."
    : "Invessiv builds landing pages, websites, and process tools with a clear conversion focus.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        de: "/de",
        en: "/en",
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      locale: isGerman ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    notFound();
  }

  return <MarketingHomePageClient />;
}
