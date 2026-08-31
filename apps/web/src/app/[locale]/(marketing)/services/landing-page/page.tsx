import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OPEN_GRAPH_LOCALE } from "@invessiv/common";
import { LandingPage } from "@/components/marketing/landing/landing-page/landing-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getLandingMetaContent } from "@/i18n/dictionaries/landing/meta";
import { createLandingStructuredData } from "@/lib/seo/landing-structured-data";
import {
  createPageMetadata,
  createRouteAlternates,
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

  const { title, description, imageAlt, imageHeight, imageUrl, imageWidth } =
    getLandingMetaContent(locale);
  return createPageMetadata({
    absoluteTitle: true,
    title,
    description,
    canonicalPath: createLocalePathname(
      SITE_ROUTES.LANDING_PAGE_SERVICE,
      locale,
    ),
    languages: createRouteAlternates(SITE_ROUTES.LANDING_PAGE_SERVICE),
    openGraphLocale: OPEN_GRAPH_LOCALE[locale],
    socialImage: {
      alt: imageAlt,
      height: imageHeight,
      url: imageUrl,
      width: imageWidth,
    },
  });
}

export default async function LandingRoute({ params }: LandingRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const landingStructuredData = createLandingStructuredData(activeLocale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(landingStructuredData),
        }}
      />
      <LandingPage locale={activeLocale} />
    </>
  );
}
