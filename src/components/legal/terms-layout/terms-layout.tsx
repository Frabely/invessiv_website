import type { ReactNode } from "react";
import Link from "next/link";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { PRIMARY_NAVIGATION } from "@/config/site";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import styles from "./terms-layout.module.css";

type TermsLayoutProps = {
  breadcrumbAriaLabel: string;
  children: ReactNode;
  homeLabel: string;
  lead: string;
  locale: Locale;
  title: string;
  updatedAt?: string;
};

export function TermsLayout({
  breadcrumbAriaLabel,
  children,
  homeLabel,
  lead,
  locale,
  title,
  updatedAt,
}: TermsLayoutProps) {
  const footerSection = getHomeSections(locale).find(
    (section) => section.id === "footer",
  );
  const legalHeaderNavigation = PRIMARY_NAVIGATION.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
  }));
  const localizeFooterHref = (href: string) => {
    if (href.startsWith("#")) {
      return `/${locale}${href}`;
    }
    return href;
  };
  const localizedFooterColumns =
    footerSection?.footerColumns?.map((column) => ({
      ...column,
      links: column.links.map((link) => ({
        ...link,
        href: localizeFooterHref(link.href),
      })),
    })) ?? [];
  const localizedFooterLegalLinks =
    footerSection?.footerLegalLinks?.map((link) => ({
      ...link,
      href: localizeFooterHref(link.href),
    })) ?? [];

  return (
    <>
      <SiteHeader
        brandHref={`/${locale}`}
        ctaHref={`/${locale}#contact`}
        navigation={legalHeaderNavigation}
      />
      <main className={`legal-page ${styles.page}`}>
        <div className={styles.inner}>
          <nav
            aria-label={breadcrumbAriaLabel}
            className={styles.breadcrumbsWrap}
          >
            <ol className={styles.breadcrumbs}>
              <li className={styles.breadcrumbItem}>
                <Link href={`/${locale}`} className={styles.breadcrumbLink}>
                  {homeLabel}
                </Link>
              </li>
              <li
                aria-current="page"
                className={`${styles.breadcrumbItem} ${styles.breadcrumbCurrent}`}
              >
                <span>{title}</span>
              </li>
            </ol>
          </nav>

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
          bottomNote={footerSection.footerBottomNote}
          brand={footerSection.footerBrand}
          columns={localizedFooterColumns}
          copyright={footerSection.footerCopyright}
          description={footerSection.description}
          id="footer"
          legalLinks={localizedFooterLegalLinks}
          socialLinks={footerSection.footerSocialLinks}
        />
      ) : null}
    </>
  );
}
