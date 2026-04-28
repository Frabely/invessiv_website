import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing/landing-page/landing-page";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getLandingMetaContent } from "@/i18n/dictionaries/landing/meta";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type LandingRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LandingRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const { title, description, openGraphLocale } = getLandingMetaContent(locale);
  return createPageMetadata({
    title,
    description,
    canonicalPath: `/${locale}/landing`,
    languages: createLocaleAlternates({
      de: "/de/landing",
      en: "/en/landing",
    }),
    openGraphLocale,
  });
}

export default async function LandingRoute({ params }: LandingRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <LandingPage locale={locale} />;
}
