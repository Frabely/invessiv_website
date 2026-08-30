import type { Metadata } from "next";
import { OPEN_GRAPH_LOCALE } from "@invessiv/common";
import { notFound } from "next/navigation";
import { LinkedInPostPage } from "@/components/marketing/linkedin-post/linkedin-post-page/linkedin-post-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getLinkedInPostMetaContent } from "@/i18n/dictionaries/linkedin-post/meta";
import { createLinkedInPostStructuredData } from "@/lib/seo/linkedin-post-structured-data";
import {
  createPageMetadata,
  createRouteAlternates,
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

  const { title, description, imageAlt, imageHeight, imageUrl, imageWidth } =
    getLinkedInPostMetaContent(locale);

  return createPageMetadata({
    absoluteTitle: true,
    title,
    description,
    canonicalPath: createLocalePathname(
      SITE_ROUTES.LINKEDIN_POST_SERVICE,
      locale,
    ),
    languages: createRouteAlternates(SITE_ROUTES.LINKEDIN_POST_SERVICE),
    openGraphLocale: OPEN_GRAPH_LOCALE[locale],
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
