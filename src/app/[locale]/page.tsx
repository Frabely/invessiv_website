import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingHomePageClient } from "@/components/marketing/home/marketing-home-page-client";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { SITE_URL } from "@/lib/site-metadata";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const title = "Landing pages, websites and process tools";
  const description =
    "Invessiv builds landing pages, websites, and process tools with a clear conversion focus.";

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
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <MarketingHomePageClient />;
}
