import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/legal/breadcrumbs/breadcrumbs";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  getLocalizedSectionHref,
  PRIMARY_NAVIGATION,
} from "@/config/navigation/home";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
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
  const footerSection = getHomeSections(locale).find(
    (section) => section.id === "footer",
  );
  const legalHeaderNavigation = PRIMARY_NAVIGATION.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
  }));
  const localizedNavColumn = footerSection
    ? {
        ...footerSection.navColumn,
        links: footerSection.navColumn.links.map((link) => ({
          ...link,
          href: link.href.startsWith("#")
            ? `/${locale}${link.href}`
            : link.href,
        })),
      }
    : null;

  return (
    <>
      <SiteHeader
        brandHref={`/${locale}`}
        ctaHref={getLocalizedSectionHref(locale, "contact")}
        navigation={legalHeaderNavigation}
      />
      <main className={styles.page} id="main-content" tabIndex={-1}>
        <div className={styles.inner}>
          <div className={styles.breadcrumbsWrap}>
            <Breadcrumbs
              items={[
                { href: `/${locale}`, isLink: true, label: homeLabel },
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
      {footerSection && localizedNavColumn ? (
        <FooterSection
          description={footerSection.description}
          locale={locale}
          navColumn={localizedNavColumn}
        />
      ) : null}
    </>
  );
}
