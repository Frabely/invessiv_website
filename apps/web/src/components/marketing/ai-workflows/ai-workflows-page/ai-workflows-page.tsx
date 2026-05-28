import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { AiWorkflowsHeroSection } from "@/components/marketing/ai-workflows/hero-section/hero-section";
import { ProblemExamplesSection } from "@/components/marketing/ai-workflows/problem-examples-section/problem-examples-section";
import { OfferSection } from "@/components/marketing/ai-workflows/offer-section/offer-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { FOOTER_SECTION_ID } from "@/config/navigation/home";
import {
  AI_WORKFLOWS_HEADER_NAVIGATION,
  AI_WORKFLOWS_SECTION_HREFS,
} from "@/config/navigation/ai-workflows";
import { getAiWorkflowsHeroContent } from "@/i18n/dictionaries/ai-workflows/hero";
import { getAiWorkflowsProblemExamplesContent } from "@/i18n/dictionaries/ai-workflows/problem-examples";
import { getAiWorkflowsOfferContent } from "@/i18n/dictionaries/ai-workflows/offer";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";

type AiWorkflowsPageProps = {
  locale: Locale;
};

export function AiWorkflowsPage({ locale }: AiWorkflowsPageProps) {
  const hero = getAiWorkflowsHeroContent(locale);
  const problemExamples = getAiWorkflowsProblemExamplesContent(locale);
  const offer = getAiWorkflowsOfferContent(locale);
  const footer = getLandingFooterContent(locale);

  return (
    <>
      <AnchorOffsetScroll />
      <SiteHeader
        ctaHref={AI_WORKFLOWS_SECTION_HREFS.contact}
        navigation={AI_WORKFLOWS_HEADER_NAVIGATION}
        showThemeSwitch={false}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <AiWorkflowsHeroSection
          {...hero}
          primaryCtaHref={AI_WORKFLOWS_SECTION_HREFS.contact}
          secondaryCtaHref={AI_WORKFLOWS_SECTION_HREFS.offer}
          trackingLocation="ai_workflows_hero"
        />

        <ProblemExamplesSection
          id={AI_WORKFLOWS_SECTION_HREFS.problem.slice(1)}
          locale={locale}
          {...problemExamples}
        />

        <OfferSection
          id={AI_WORKFLOWS_SECTION_HREFS.offer.slice(1)}
          locale={locale}
          {...offer}
        />

        {/* Sections A4–A6 folgen */}

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
