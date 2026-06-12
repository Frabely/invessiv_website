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
import { getLandingSuccessContent } from "@/i18n/dictionaries/landing/success";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getHomeFooterSectionContent } from "@/lib/navigation/home-footer-section";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type LandingSuccessRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LandingSuccessRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const { meta } = getLandingSuccessContent(locale);
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}${SITE_ROUTES.LANDING_PAGE_SERVICE_SUCCESS}`,
    ]),
  );

  return {
    ...createPageMetadata({
      absoluteTitle: true,
      title: meta.title,
      description: meta.description,
      canonicalPath: `/${locale}${SITE_ROUTES.LANDING_PAGE_SERVICE_SUCCESS}`,
      languages: createLocaleAlternates(languages),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function LandingSuccessRoute({
  params,
}: LandingSuccessRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const { page } = getLandingSuccessContent(activeLocale);
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
            SITE_ROUTES.LANDING_PAGE_SERVICE,
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
