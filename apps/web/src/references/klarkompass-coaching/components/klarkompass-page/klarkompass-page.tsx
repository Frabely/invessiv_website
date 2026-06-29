import { DM_Sans, Fraunces } from "next/font/google";
import { AboutSection } from "@/references/klarkompass-coaching/components/about-section/about-section";
import { FaqSection } from "@/references/klarkompass-coaching/components/faq-section/faq-section";
import { FinalCtaSection } from "@/references/klarkompass-coaching/components/final-cta-section/final-cta-section";
import { HeroSection } from "@/references/klarkompass-coaching/components/hero-section/hero-section";
import { KlarkompassFooter } from "@/references/klarkompass-coaching/components/klarkompass-footer/klarkompass-footer";
import { KlarkompassHeader } from "@/references/klarkompass-coaching/components/klarkompass-header/klarkompass-header";
import { OfferSection } from "@/references/klarkompass-coaching/components/offer-section/offer-section";
import { ProblemSection } from "@/references/klarkompass-coaching/components/problem-section/problem-section";
import { ProcessSection } from "@/references/klarkompass-coaching/components/process-section/process-section";
import { ResultsSection } from "@/references/klarkompass-coaching/components/results-section/results-section";
import { TrustPointsSection } from "@/references/klarkompass-coaching/components/trust-points-section/trust-points-section";
import type { Locale } from "@/config/i18n";
import { getKlarkompassContent } from "@/references/klarkompass-coaching/i18n/content";
import {
  KLARKOMPASS_NAV_SECTION_IDS,
  KLARKOMPASS_SECTION_ID,
} from "@/references/klarkompass-coaching/constants/section-ids";
import styles from "./klarkompass-page.module.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--kk-font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--kk-font-sans",
  display: "swap",
});

type KlarkompassPageProps = {
  locale: Locale;
};

export function KlarkompassPage({ locale }: KlarkompassPageProps) {
  const content = getKlarkompassContent(locale);
  const homeHref = `#${KLARKOMPASS_SECTION_ID.Hero}`;
  const ctaHref = `#${KLARKOMPASS_SECTION_ID.FinalCta}`;

  const navItems = KLARKOMPASS_NAV_SECTION_IDS.map((sectionId, index) => ({
    href: sectionId,
    label: content.header.navLabels[index] ?? sectionId,
  }));
  const footerNavItems = KLARKOMPASS_NAV_SECTION_IDS.map(
    (sectionId, index) => ({
      href: sectionId,
      label: content.footer.navLabels[index] ?? sectionId,
    }),
  );

  return (
    <div
      className={`${styles.brandScope} ${display.variable} ${sans.variable}`}
    >
      <KlarkompassHeader
        brand={content.header.brand}
        ctaAlertMessage={content.header.ctaAlertMessage}
        ctaHref={ctaHref}
        ctaLabel={content.header.ctaLabel}
        homeHref={homeHref}
        menuCloseLabel={content.header.menuCloseLabel}
        menuOpenLabel={content.header.menuOpenLabel}
        navItems={navItems}
      />

      <main className={styles.main} id="main-content" tabIndex={-1}>
        <HeroSection
          id={KLARKOMPASS_SECTION_ID.Hero}
          locale={locale}
          mockAlertMessage={content.header.ctaAlertMessage}
          primaryHref={ctaHref}
          secondaryHref={`#${KLARKOMPASS_SECTION_ID.Offer}`}
          {...content.hero}
        />

        <ProblemSection
          id={KLARKOMPASS_SECTION_ID.Problem}
          locale={locale}
          {...content.problem}
        />

        <ResultsSection
          id={KLARKOMPASS_SECTION_ID.Results}
          locale={locale}
          {...content.results}
        />

        <TrustPointsSection
          id={KLARKOMPASS_SECTION_ID.Trust}
          locale={locale}
          {...content.trust}
        />

        <OfferSection
          ctaHref={ctaHref}
          id={KLARKOMPASS_SECTION_ID.Offer}
          locale={locale}
          mockAlertMessage={content.header.ctaAlertMessage}
          {...content.offer}
        />

        <AboutSection
          id={KLARKOMPASS_SECTION_ID.About}
          locale={locale}
          {...content.about}
        />

        <ProcessSection
          id={KLARKOMPASS_SECTION_ID.Process}
          locale={locale}
          {...content.process}
        />

        <FaqSection
          ctaHref={ctaHref}
          ctaLabel={content.header.ctaLabel}
          id={KLARKOMPASS_SECTION_ID.Faq}
          locale={locale}
          mockAlertMessage={content.header.ctaAlertMessage}
          {...content.faq}
        />

        <FinalCtaSection
          id={KLARKOMPASS_SECTION_ID.FinalCta}
          locale={locale}
          mockAlertMessage={content.header.ctaAlertMessage}
          {...content.finalCta}
        />
      </main>

      <KlarkompassFooter
        backHref={`/${locale}`}
        backLinkLabel={content.footer.backLinkLabel}
        brand={content.footer.brand}
        conceptNote={content.footer.conceptNote}
        navItems={footerNavItems}
        tagline={content.footer.tagline}
      />
    </div>
  );
}
