import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { AiWorkflowsHeroSection } from "@/components/marketing/linkedin-post/hero-section/hero-section";
import { ProblemExamplesSection } from "@/components/marketing/linkedin-post/problem-examples-section/problem-examples-section";
import { OfferSection } from "@/components/marketing/linkedin-post/offer-section/offer-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { FOOTER_SECTION_ID } from "@/config/navigation/home";
import {
  LINKEDIN_POST_HEADER_NAVIGATION,
  LINKEDIN_POST_SECTION_HREFS,
} from "@/config/navigation/linkedin-post";
import { getLinkedInPostHeroContent } from "@/i18n/dictionaries/linkedin-post/hero";
import { getLinkedInPostProblemExamplesContent } from "@/i18n/dictionaries/linkedin-post/problem-examples";
import { getLinkedInPostOfferContent } from "@/i18n/dictionaries/linkedin-post/offer";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";

type LinkedInPostPageProps = {
  locale: Locale;
};

export function LinkedInPostPage({ locale }: LinkedInPostPageProps) {
  const hero = getLinkedInPostHeroContent(locale);
  const problemExamples = getLinkedInPostProblemExamplesContent(locale);
  const offer = getLinkedInPostOfferContent(locale);
  const footer = getLandingFooterContent(locale);

  return (
    <>
      <AnchorOffsetScroll />
      <SiteHeader
        ctaHref={LINKEDIN_POST_SECTION_HREFS.generator}
        navigation={LINKEDIN_POST_HEADER_NAVIGATION}
        showThemeSwitch={false}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <AiWorkflowsHeroSection
          {...hero}
          primaryCtaHref={LINKEDIN_POST_SECTION_HREFS.generator}
          secondaryCtaHref={LINKEDIN_POST_SECTION_HREFS.offer}
          trackingLocation="linkedin_post_hero"
        />

        <ProblemExamplesSection
          id={LINKEDIN_POST_SECTION_HREFS.problem.slice(1)}
          locale={locale}
          {...problemExamples}
        />

        <OfferSection
          id={LINKEDIN_POST_SECTION_HREFS.offer.slice(1)}
          locale={locale}
          ctaHref={LINKEDIN_POST_SECTION_HREFS.generator}
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
