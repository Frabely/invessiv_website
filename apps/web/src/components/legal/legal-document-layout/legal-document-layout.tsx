import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/legal/breadcrumbs/breadcrumbs";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  getLocalizedSectionHref,
  PRIMARY_NAVIGATION,
} from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { getHomeFooterSectionContent } from "@/lib/navigation/home-footer-section";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import styles from "./legal-document-layout.module.css";

type LegalDocumentLayoutProps = {
  breadcrumbAriaLabel: string;
  children: ReactNode;
  homeLabel: string;
  lead: string;
  locale: Locale;
  title: string;
  updatedAt?: string;
};

export function LegalDocumentLayout({
  breadcrumbAriaLabel,
  children,
  homeLabel,
  lead,
  locale,
  title,
  updatedAt,
}: LegalDocumentLayoutProps) {
  const footerSection = getHomeFooterSectionContent(locale);
  const homeHref = createLocalePathname(SITE_ROUTES.HOME, locale);
  const legalHeaderNavigation = PRIMARY_NAVIGATION.map((item) => ({
    ...item,
    href: createLocalePathname(item.href, locale),
  }));

  return (
    <>
      <SiteHeader
        brandHref={homeHref}
        ctaHref={getLocalizedSectionHref(locale, "contact")}
        navigation={legalHeaderNavigation}
      />
      <main className={styles.page} id="main-content" tabIndex={-1}>
        <div className={styles.inner}>
          <div className={styles.breadcrumbsWrap}>
            <Breadcrumbs
              items={[
                { href: homeHref, isLink: true, label: homeLabel },
                { isLink: false, label: title },
              ]}
              navLabel={breadcrumbAriaLabel}
            />
          </div>

          <header className={styles.intro}>
            <h1>{title}</h1>
            <p className={styles.lead}>{lead}</p>
            {updatedAt ? <p className={styles.updatedAt}>{updatedAt}</p> : null}
          </header>

          {children}
        </div>
      </main>
      {footerSection ? (
        <FooterSection
          description={footerSection.description}
          locale={locale}
          navColumn={footerSection.navColumn}
        />
      ) : null}
    </>
  );
}
