import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { SuccessPage } from "@/components/shared/success-page/success-page";
import { COMPANY_CALENDLY } from "@/config/company";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { getLinkedInPostSuccessContent } from "@/i18n/dictionaries/linkedin-post/success";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getHomeFooterSectionContent } from "@/lib/navigation/home-footer-section";
import {
  createPageMetadata,
  createRouteAlternates,
} from "@/lib/seo/page-metadata";

type LinkedInPostSuccessRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LinkedInPostSuccessRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const { meta } = getLinkedInPostSuccessContent(locale);
  return {
    ...createPageMetadata({
      absoluteTitle: true,
      title: meta.title,
      description: meta.description,
      canonicalPath: createLocalePathname(
        SITE_ROUTES.LINKEDIN_POST_SERVICE_SUCCESS,
        locale,
      ),
      languages: createRouteAlternates(
        SITE_ROUTES.LINKEDIN_POST_SERVICE_SUCCESS,
      ),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function LinkedInPostSuccessRoute({
  params,
}: LinkedInPostSuccessRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const { page } = getLinkedInPostSuccessContent(activeLocale);
  const footer = getHomeFooterSectionContent(activeLocale);

  return (
    <>
      <SiteHeader
        isMinimalHeader
        brandHref={createLocalePathname(SITE_ROUTES.HOME, activeLocale)}
      />
      <main id="main-content" tabIndex={-1}>
        <SuccessPage
          {...page}
          backHref={createLocalePathname(
            SITE_ROUTES.LINKEDIN_POST_SERVICE,
            activeLocale,
          )}
          contactHref={COMPANY_CALENDLY}
        />
      </main>
      {footer ? (
        <FooterSection
          description={footer.description}
          locale={activeLocale}
          navColumn={footer.navColumn}
        />
      ) : null}
    </>
  );
}
