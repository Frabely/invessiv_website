import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/marketing/home/home-page/home-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { isMarketingProofEnabled } from "@/config/marketing-launch";
import { getHomeMetaContent } from "@/i18n/dictionaries/marketing/home-meta";
import { createMarketingStructuredData } from "@/lib/seo/marketing-structured-data";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const { title, description, openGraphLocale } = getHomeMetaContent(locale);
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}`,
    ]),
  );
  return createPageMetadata({
    absoluteTitle: true,
    title,
    description,
    canonicalPath: `/${locale}`,
    languages: createLocaleAlternates(languages),
    openGraphLocale,
  });
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const { description } = getHomeMetaContent(activeLocale);
  const marketingStructuredData = createMarketingStructuredData(
    activeLocale,
    description,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(marketingStructuredData),
        }}
      />
      <HomePage showProofSection={isMarketingProofEnabled()} />
    </>
  );
}
