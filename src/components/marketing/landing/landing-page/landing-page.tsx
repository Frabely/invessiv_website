import { AudienceSection } from "@/components/marketing/landing/audience-section/audience-section";
import { FaqSection } from "@/components/marketing/landing/faq-section/faq-section";
import { FinalCtaSection } from "@/components/marketing/landing/final-cta-section/final-cta-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { InclusionsSection } from "@/components/marketing/landing/inclusions-section/inclusions-section";
import { ProblemSection } from "@/components/marketing/landing/problem-section/problem-section";
import { PricingSection } from "@/components/marketing/landing/pricing-section/pricing-section";
import { ProcessSection } from "@/components/marketing/landing/process-section/process-section";
import { SolutionSection } from "@/components/marketing/landing/solution-section/solution-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  CONTACT_SECTION_ID,
  FOOTER_SECTION_ID,
  SECTION_HREFS,
  type NavigationItem,
} from "@/config/site";
import { getLandingAudienceContent } from "@/i18n/dictionaries/landing/audience";
import { getLandingFaqContent } from "@/i18n/dictionaries/landing/faq";
import { getLandingFinalCtaContent } from "@/i18n/dictionaries/landing/final-cta";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";
import { getLandingHeaderContent } from "@/i18n/dictionaries/landing/header";
import { getLandingHeroContent } from "@/i18n/dictionaries/landing/hero";
import { getLandingInclusionsContent } from "@/i18n/dictionaries/landing/inclusions";
import { getLandingPricingContent } from "@/i18n/dictionaries/landing/pricing";
import { getLandingProblemContent } from "@/i18n/dictionaries/landing/problem";
import { getLandingProcessContent } from "@/i18n/dictionaries/landing/process";
import { getLandingSolutionContent } from "@/i18n/dictionaries/landing/solution";

const LANDING_NAVIGATION: NavigationItem[] = [
  { href: "#problem" },
  { href: "#solution" },
  { href: "#inclusions" },
  { href: "#audience" },
  { href: "#process" },
  { href: "#pricing" },
  { href: "#faq" },
];

type LandingPageProps = {
  locale: Locale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const audience = getLandingAudienceContent(locale);
  const faq = getLandingFaqContent(locale);
  const finalCta = getLandingFinalCtaContent(locale);
  const footer = getLandingFooterContent(locale);
  const header = getLandingHeaderContent(locale);
  const hero = getLandingHeroContent(locale);
  const inclusions = getLandingInclusionsContent(locale);
  const pricing = getLandingPricingContent(locale);
  const problem = getLandingProblemContent(locale);
  const process = getLandingProcessContent(locale);
  const solution = getLandingSolutionContent(locale);

  return (
    <>
      <SiteHeader
        ctaHref={SECTION_HREFS.contact}
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
          primaryCtaAnalyticsTarget={CONTACT_SECTION_ID}
          primaryCtaHref={SECTION_HREFS.contact}
          secondaryCtaAnalyticsTarget="process"
          secondaryCtaHref={SECTION_HREFS.process}
          title={hero.title}
          trackingLocation="landing_hero"
        />

        <ProblemSection id="problem" locale={locale} {...problem} />

        <SolutionSection id="solution" locale={locale} {...solution} />

        <InclusionsSection id="inclusions" locale={locale} {...inclusions} />

        <AudienceSection id="audience" locale={locale} {...audience} />

        <ProcessSection id="process" locale={locale} {...process} />

        <PricingSection
          ctaHref={SECTION_HREFS.contact}
          id="pricing"
          locale={locale}
          {...pricing}
        />

        <FaqSection id="faq" locale={locale} {...faq} />

        <FinalCtaSection
          id={CONTACT_SECTION_ID}
          locale={locale}
          {...finalCta}
        />

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
