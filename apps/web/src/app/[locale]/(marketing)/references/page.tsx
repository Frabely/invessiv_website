import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OPEN_GRAPH_LOCALE } from "@invessiv/common";
import { REFERENCE_IMAGE_KEY } from "@/common/constants/marketing/reference-image-key";
import { ReferencesPage } from "@/components/marketing/references/references-page/references-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { isConsumptionReferenceEnabled } from "@/config/marketing-launch";
import { getReferencesMetaContent } from "@/i18n/dictionaries/marketing/references-meta";
import {
  getReferencesPageContent,
  type ReferencesPageContent,
} from "@/i18n/dictionaries/marketing/references";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { createReferencesStructuredData } from "@/lib/seo/references-structured-data";
import {
  createPageMetadata,
  createRouteAlternates,
} from "@/lib/seo/page-metadata";

type ReferencesLocalePageProps = {
  params: Promise<{ locale: string }>;
};

function getVisibleReferencesContent(locale: Locale): ReferencesPageContent {
  const content = getReferencesPageContent(locale);
  const projects = isConsumptionReferenceEnabled()
    ? content.projects
    : content.projects.filter(
        (project) => project.imageKey !== REFERENCE_IMAGE_KEY.Consumption,
      );

  return {
    ...content,
    hero: {
      ...content.hero,
      highlights: content.hero.highlights.map((highlight) =>
        highlight.replace("{count}", String(projects.length)),
      ),
    },
    projects,
  };
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: ReferencesLocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const { description, imageAlt, imageHeight, imageUrl, imageWidth, title } =
    getReferencesMetaContent(locale);
  return createPageMetadata({
    title,
    description,
    canonicalPath: createLocalePathname(SITE_ROUTES.REFERENCES, locale),
    languages: createRouteAlternates(SITE_ROUTES.REFERENCES),
    openGraphLocale: OPEN_GRAPH_LOCALE[locale],
    socialImage: {
      alt: imageAlt,
      height: imageHeight,
      url: imageUrl,
      width: imageWidth,
    },
  });
}

export default async function ReferencesLocalePage({
  params,
}: ReferencesLocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const content = getVisibleReferencesContent(activeLocale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            createReferencesStructuredData(activeLocale, content),
          ),
        }}
      />
      <ReferencesPage content={content} locale={activeLocale} />
    </>
  );
}
