import type { ReactNode } from "react";
import { LegalBreadcrumbs } from "@/components/legal/legal-breadcrumbs/legal-breadcrumbs";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { PRIMARY_NAVIGATION } from "@/config/site";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";

type LegalLayoutProps = {
  breadcrumbAriaLabel: string;
  children: ReactNode;
  homeLabel: string;
  lead: string;
  locale: Locale;
  title: string;
  updatedAt?: string;
};

export function LegalLayout({
  breadcrumbAriaLabel,
  children,
  homeLabel,
  lead,
  locale,
  title,
  updatedAt,
}: LegalLayoutProps) {
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
      <main className="legal-page">
        <LegalBreadcrumbs
          items={[
            { href: `/${locale}`, isLink: true, label: homeLabel },
            { isLink: false, label: title },
          ]}
          navLabel={breadcrumbAriaLabel}
        />
        <div className="legal-page__inner">
          <header className="legal-page__intro">
            <h1>{title}</h1>
            <p className="legal-lead">{lead}</p>
            {updatedAt ? <p className="legal-updated-at">{updatedAt}</p> : null}
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
