import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectsPage } from "@/components/marketing/projects/projects-page/projects-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { isMarketingProofEnabled } from "@/config/marketing-launch";
import { getProjectsMetaContent } from "@/i18n/dictionaries/marketing/projects-meta";
import { getProjectsPageContent } from "@/i18n/dictionaries/marketing/projects";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type ProjectsLocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: ProjectsLocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  if (!isMarketingProofEnabled()) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { title, description, openGraphLocale } =
    getProjectsMetaContent(locale);

  return createPageMetadata({
    title,
    description,
    canonicalPath: `/${locale}/projects`,
    languages: createLocaleAlternates({
      de: "/de/projects",
      en: "/en/projects",
    }),
    openGraphLocale,
  });
}

export default async function ProjectsLocalePage({
  params,
}: ProjectsLocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;

  if (!isMarketingProofEnabled()) {
    redirect(`/${activeLocale}`);
  }

  return (
    <ProjectsPage
      content={getProjectsPageContent(activeLocale)}
      locale={activeLocale}
    />
  );
}
