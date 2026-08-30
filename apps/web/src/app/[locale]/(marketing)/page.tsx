import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OPEN_GRAPH_LOCALE } from "@invessiv/common";
import { HomePage } from "@/components/marketing/home/home-page/home-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getHomeMetaContent } from "@/i18n/dictionaries/marketing/home-meta";
import { createMarketingStructuredData } from "@/lib/seo/marketing-structured-data";
import {
  createPageMetadata,
  createRouteAlternates,
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

  const { description, imageAlt, imageHeight, imageUrl, imageWidth, title } =
    getHomeMetaContent(locale);
  return createPageMetadata({
    absoluteTitle: true,
    title,
    description,
    canonicalPath: createLocalePathname(SITE_ROUTES.HOME, locale),
    languages: createRouteAlternates(SITE_ROUTES.HOME),
    openGraphLocale: OPEN_GRAPH_LOCALE[locale],
    socialImage: {
      alt: imageAlt,
      height: imageHeight,
      url: imageUrl,
      width: imageWidth,
    },
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
      <HomePage />
    </>
  );
}
