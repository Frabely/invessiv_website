import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing/landing-page/landing-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { getLandingMetaContent } from "@/i18n/dictionaries/landing/meta";
import { createLandingStructuredData } from "@/lib/seo/landing-structured-data";
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

  const {
    title,
    description,
    imageAlt,
    imageHeight,
    imageUrl,
    imageWidth,
    openGraphLocale,
  } = getLandingMetaContent(locale);
  return createPageMetadata({
    absoluteTitle: true,
    title,
    description,
    canonicalPath: `/${locale}/services/landing-page`,
    languages: createLocaleAlternates({
      de: "/de/services/landing-page",
      en: "/en/services/landing-page",
    }),
    openGraphLocale,
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
