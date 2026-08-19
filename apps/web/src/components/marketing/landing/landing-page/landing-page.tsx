import { CookieSettingsButton } from "@/components/consent/cookie-settings-button/cookie-settings-button";
import { AudienceSection } from "@/components/marketing/landing/audience-section/audience-section";
import { FaqSection } from "@/components/marketing/landing/faq-section/faq-section";
import { LandingFunnelTracker } from "@/components/shared/analytics/landing-funnel-tracker/landing-funnel-tracker";
import { FinalCtaSection } from "@/components/shared/final-cta-section/final-cta-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { LandingVisualStage } from "@/components/marketing/landing/landing-visual-stage/landing-visual-stage";
import { SectionScrollFade } from "@/components/marketing/landing/section-scroll-fade/section-scroll-fade";
import { PricingSection } from "@/components/marketing/landing/pricing-section/pricing-section";
import { ProcessSection } from "@/components/marketing/landing/process-section/process-section";
import { TrustSection } from "@/components/marketing/landing/trust-section/trust-section";
import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { ConsentProvider } from "@/components/providers/consent-provider/consent-provider";
import { GoogleTag } from "@/components/providers/google-tag/google-tag";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  LANDING_FUNNEL_SECTION_IDS,
  LANDING_HEADER_NAVIGATION,
  LANDING_SECTION_IDS,
} from "@/config/navigation/landing";
import { CONTACT_SECTION_ID, SECTION_HREFS } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
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
import { getConsentStaticContent } from "@/i18n/dictionaries/shared/consent";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";

type LandingPageProps = {
  locale: Locale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const consent = getConsentStaticContent(locale);
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
    <ConsentProvider content={consent} locale={locale}>
      <GoogleTag />
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

        <LandingFunnelTracker />

        <LandingVisualStage
          hero={
            <HeroSection
              compactMobile
              description={hero.description}
              heroPrimaryCta={hero.primaryCta}
              heroSecondaryCta={hero.secondaryCta}
              heroTag={hero.tag}
              heroTrustLine={hero.trustLine}
              heroVideoSrc="/assets/landing-page/spotlight.mp4"
              primaryCtaAnalyticsTarget={CONTACT_SECTION_ID}
              primaryCtaHref={SECTION_HREFS.contact}
              secondaryCtaAnalyticsTarget="process"
              secondaryCtaHref={SECTION_HREFS.process}
              title={hero.title}
              trackingLocation="landing_hero"
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
          replyAnalyticsTarget={CONTACT_SECTION_ID}
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
          analyticsLocation="landing_final_cta"
          formId="landing_final_cta"
          id={CONTACT_SECTION_ID}
          locale={locale}
          origin={ContactSubmissionOrigin.LandingPage}
          successRedirectHref={createLocalePathname(
            SITE_ROUTES.LANDING_PAGE_SERVICE_SUCCESS,
            locale,
          )}
          trackAdsConversion
          {...finalCta}
        />

        <FooterSection
          cookieSettings={<CookieSettingsButton />}
          description={footer.description}
          locale={locale}
          navColumn={footer.navColumn}
        />
      </main>
    </ConsentProvider>
  );
}
