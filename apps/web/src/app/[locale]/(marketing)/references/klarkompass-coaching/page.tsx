// reference demo glue → @/references/klarkompass-coaching (Entfernen: siehe README)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KlarkompassPage } from "@/references/klarkompass-coaching/components/klarkompass-page/klarkompass-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { getKlarkompassMetaContent } from "@/references/klarkompass-coaching/i18n/meta";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type KlarkompassRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: KlarkompassRouteProps): Promise<Metadata> {
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
  } = getKlarkompassMetaContent(locale);
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}${SITE_ROUTES.REFERENCES_KLARKOMPASS}`,
    ]),
  );

  return {
    ...createPageMetadata({
      absoluteTitle: true,
      title,
      description,
      canonicalPath: `/${locale}${SITE_ROUTES.REFERENCES_KLARKOMPASS}`,
      languages: createLocaleAlternates(languages),
      openGraphLocale,
      socialImage: {
        alt: imageAlt,
        height: imageHeight,
        url: imageUrl,
        width: imageWidth,
      },
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function KlarkompassRoute({
  params,
}: KlarkompassRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <KlarkompassPage locale={locale as Locale} />;
}
