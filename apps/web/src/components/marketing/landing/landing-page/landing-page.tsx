import { AudienceSection } from "@/components/marketing/landing/audience-section/audience-section";
import { FaqSection } from "@/components/marketing/landing/faq-section/faq-section";
import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsFormPlacement } from "@/common/constants/analytics/analytics-form";
import { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { SectionReachTracker } from "@/components/shared/analytics/section-reach-tracker/section-reach-tracker";
import { FinalCtaSection } from "@/components/shared/final-cta-section/final-cta-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { LandingVisualStage } from "@/components/marketing/landing/landing-visual-stage/landing-visual-stage";
import { SectionScrollFade } from "@/components/marketing/landing/section-scroll-fade/section-scroll-fade";
import { PricingSection } from "@/components/marketing/landing/pricing-section/pricing-section";
import { ProcessSection } from "@/components/marketing/landing/process-section/process-section";
import { TrustSection } from "@/components/marketing/landing/trust-section/trust-section";
import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  LANDING_FUNNEL_SECTION_IDS,
  LANDING_HEADER_NAVIGATION,
  LANDING_SECTION_IDS,
} from "@/config/navigation/landing";
import {
  CONTACT_SECTION_ID,
  FOOTER_SECTION_ID,
  SECTION_HREFS,
} from "@/config/navigation/home";
import { getLandingAudienceContent } from "@/i18n/dictionaries/landing/audience";
import { getLandingFaqContent } from "@/i18n/dictionaries/landing/faq";
import { getLandingFinalCtaContent } from "@/i18n/dictionaries/landing/final-cta";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";
import { getLandingHeaderContent } from "@/i18n/dictionaries/landing/header";
import { getLandingHeroContent } from "@/i18n/dictionaries/landing/hero";
import { getLandingPricingContent } from "@/i18n/dictionaries/landing/pricing";
import { getLandingProblemSolutionContent } from "@/i18n/dictionaries/landing/problem-solution";
import { getLandingProcessContent } from "@/i18n/dictionaries/landing/process";
import { getLandingTrustContent } from "@/i18n/dictionaries/landing/trust";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";

const LANDING_REACH_SECTION_IDS = [
  ...LANDING_FUNNEL_SECTION_IDS,
  FOOTER_SECTION_ID,
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
  const pricing = getLandingPricingContent(locale);
  const problemSolution = getLandingProblemSolutionContent(locale);
  const process = getLandingProcessContent(locale);
  const trust = getLandingTrustContent(locale);

  return (
    <>
      <AnchorOffsetScroll />
      <SiteHeader
        ctaHref={SECTION_HREFS.contact}
        navigation={LANDING_HEADER_NAVIGATION}
        showThemeSwitch={false}
        uiContent={header}
      />

      <main
        className="marketing-main landing-main"
        id="main-content"
        tabIndex={-1}
      >
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <SectionReachTracker
          page={AnalyticsPage.Landing}
          sectionIds={LANDING_REACH_SECTION_IDS}
        />

        <LandingVisualStage
          hero={
            <HeroSection
              compactMobile
              description={hero.description}
              heroPrimaryCta={hero.primaryCta}
              heroSecondaryCta={hero.secondaryCta}
              heroTag={hero.tag}
              heroTrustChips={hero.trustPoints}
              primaryCtaAnalytics={{
                cta: AnalyticsCtaId.LandingHeroPrimary,
                target: AnalyticsTarget.ContactForm,
              }}
              primaryCtaHref={SECTION_HREFS.contact}
              secondaryCtaAnalytics={{
                cta: AnalyticsCtaId.LandingHeroSecondary,
                target: AnalyticsTarget.Process,
              }}
              secondaryCtaHref={SECTION_HREFS.process}
              title={hero.title}
              visualBleed
              visualSlot={null}
            />
          }
          locale={locale}
          preview={hero.preview}
          problemSolution={problemSolution}
          solutionSectionId={LANDING_SECTION_IDS.solution}
        />

        <SectionScrollFade sectionIds={LANDING_FUNNEL_SECTION_IDS} />

        <TrustSection
          id={LANDING_SECTION_IDS.trust}
          locale={locale}
          replyHref={SECTION_HREFS.contact}
          {...trust}
        />

        <AudienceSection
          id={LANDING_SECTION_IDS.audience}
          locale={locale}
          {...audience}
        />

        <ProcessSection
          id={LANDING_SECTION_IDS.process}
          locale={locale}
          {...process}
        />

        <PricingSection
          ctaHref={SECTION_HREFS.contact}
          id={LANDING_SECTION_IDS.pricing}
          locale={locale}
          {...pricing}
        />

        <FaqSection id={LANDING_SECTION_IDS.faq} locale={locale} {...faq} />

        <FinalCtaSection
          analyticsPlacement={AnalyticsFormPlacement.LandingFinal}
          id={CONTACT_SECTION_ID}
          locale={locale}
          origin={ContactSubmissionOrigin.LandingPage}
          projectScope="landing_page"
          projectScopeLabel={finalCta.form.projectScopeLabel}
          {...finalCta}
        />

        <FooterSection
          description={footer.description}
          locale={locale}
          navColumn={footer.navColumn}
        />
      </main>
    </>
  );
}
