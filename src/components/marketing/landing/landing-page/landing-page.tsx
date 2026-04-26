import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { ProblemSection } from "@/components/marketing/landing/problem-section/problem-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  FOOTER_SECTION_ID,
  SECTION_HREFS,
  type NavigationItem,
} from "@/config/site";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";
import { getLandingHeaderContent } from "@/i18n/dictionaries/landing/header";
import { getLandingHeroContent } from "@/i18n/dictionaries/landing/hero";
import { getLandingProblemContent } from "@/i18n/dictionaries/landing/problem";

const LANDING_NAVIGATION: NavigationItem[] = [{ href: "#problem" }];

type LandingPageProps = {
  locale: Locale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const footer = getLandingFooterContent(locale);
  const header = getLandingHeaderContent(locale);
  const hero = getLandingHeroContent(locale);
  const problem = getLandingProblemContent(locale);

  return (
    <>
      <SiteHeader
        ctaHref={SECTION_HREFS.footer}
        navigation={LANDING_NAVIGATION}
        showThemeSwitch={false}
        uiContent={header}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <HeroSection
          description={hero.description}
          heroPrimaryCta={hero.primaryCta}
          heroSecondaryCta={hero.secondaryCta}
          heroTag={hero.tag}
          heroTrustLine={hero.trustLine}
          heroVisualAriaLabel={hero.visualAriaLabel}
          primaryCtaAnalyticsTarget={FOOTER_SECTION_ID}
          primaryCtaHref={SECTION_HREFS.footer}
          secondaryCtaAnalyticsTarget={FOOTER_SECTION_ID}
          secondaryCtaHref={SECTION_HREFS.footer}
          title={hero.title}
          trackingLocation="landing_hero"
        />

        <ProblemSection id="problem" locale={locale} {...problem} />

        <FooterSection
          bottomNote={footer.bottomNote}
          brand={footer.brand}
          columns={footer.columns}
          copyright={footer.copyright}
          description={footer.description}
          id={FOOTER_SECTION_ID}
          legalLinks={footer.legalLinks}
          socialLinks={footer.socialLinks}
        />
      </main>
    </>
  );
}
