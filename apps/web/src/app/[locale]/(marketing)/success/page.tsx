import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button/cookie-settings-button";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { ConsentProvider } from "@/components/providers/consent-provider/consent-provider";
import { GoogleTag } from "@/components/providers/google-tag/google-tag";
import { SuccessPage } from "@/components/shared/success-page/success-page";
import { COMPANY_CALENDLY } from "@/config/company";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { getSuccessContent } from "@/i18n/dictionaries/marketing/success";
import { getConsentStaticContent } from "@/i18n/dictionaries/shared/consent";
import { getHomeFooterSectionContent } from "@/lib/navigation/home-footer-section";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import {
  createPageMetadata,
  createRouteAlternates,
} from "@/lib/seo/page-metadata";

type SuccessRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: SuccessRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const { meta } = getSuccessContent(locale);
  return {
    ...createPageMetadata({
      absoluteTitle: true,
      title: meta.title,
      description: meta.description,
      canonicalPath: createLocalePathname(SITE_ROUTES.SUCCESS, locale),
      languages: createRouteAlternates(SITE_ROUTES.SUCCESS),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function SuccessRoute({ params }: SuccessRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const { page } = getSuccessContent(activeLocale);
  const footer = getHomeFooterSectionContent(activeLocale);
  const consent = getConsentStaticContent(activeLocale);

  return (
    <ConsentProvider content={consent} locale={activeLocale}>
      <GoogleTag />
      <SiteHeader
        isMinimalHeader
        brandHref={createLocalePathname(SITE_ROUTES.HOME, activeLocale)}
      />
      <main id="main-content" tabIndex={-1}>
        <SuccessPage
          {...page}
          backHref={createLocalePathname(SITE_ROUTES.HOME, activeLocale)}
          contactHref={COMPANY_CALENDLY}
        />
      </main>
      {footer ? (
        <FooterSection
          cookieSettings={<CookieSettingsButton />}
          description={footer.description}
          locale={activeLocale}
          navColumn={footer.navColumn}
        />
      ) : null}
    </ConsentProvider>
  );
}
