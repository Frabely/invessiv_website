import type { ReactNode } from "react";
import { LegalBreadcrumbs } from "@/components/legal/legal-breadcrumbs/legal-breadcrumbs";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { PRIMARY_NAVIGATION } from "@/config/site";
import { getHomeSections } from "@/content/landing/home";

type LegalLayoutProps = {
  children: ReactNode;
  lead: string;
  locale: Locale;
  title: string;
};

export function LegalLayout({ children, lead, locale, title }: LegalLayoutProps) {
  const footerSection = getHomeSections(locale).find((section) => section.id === "footer");
  const legalHeaderNavigation = PRIMARY_NAVIGATION.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
  }));

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
            { href: `/${locale}`, isLink: true, label: locale === "de" ? "Startseite" : "Home" },
            { isLink: false, label: title },
          ]}
          navLabel={locale === "de" ? "Brotkrumen-Navigation" : "Breadcrumb navigation"}
        />
        <div className="legal-page__inner">
          <header className="legal-page__intro">
            <h1>{title}</h1>
            <p className="legal-lead">{lead}</p>
          </header>
          {children}
        </div>
      </main>
      {footerSection ? (
        <FooterSection
          bottomNote={footerSection.footerBottomNote}
          brand={footerSection.footerBrand}
          columns={footerSection.footerColumns ?? []}
          copyright={footerSection.footerCopyright}
          description={footerSection.description}
          id="footer"
          legalLinks={footerSection.footerLegalLinks}
          socialLinks={footerSection.footerSocialLinks}
        />
      ) : null}
    </>
  );
}
