import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkedInPostPage } from "@/components/marketing/linkedin-post/ai-workflows-page/ai-workflows-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { getLinkedInPostMetaContent } from "@/i18n/dictionaries/linkedin-post/meta";
import { createLinkedInPostStructuredData } from "@/lib/seo/linkedin-post-structured-data";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type LinkedInPostRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LinkedInPostRouteProps): Promise<Metadata> {
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
  } = getLinkedInPostMetaContent(locale);

  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}${SITE_ROUTES.LINKEDIN_POST_SERVICE}`,
    ]),
  );
  return createPageMetadata({
    absoluteTitle: true,
    title,
    description,
    canonicalPath: `/${locale}${SITE_ROUTES.LINKEDIN_POST_SERVICE}`,
    languages: createLocaleAlternates(languages),
    openGraphLocale,
    socialImage: {
      alt: imageAlt,
      height: imageHeight,
      url: imageUrl,
      width: imageWidth,
    },
  });
}

export default async function LinkedInPostRoute({
  params,
}: LinkedInPostRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const structuredData = createLinkedInPostStructuredData(activeLocale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LinkedInPostPage locale={activeLocale} />
    </>
  );
}
