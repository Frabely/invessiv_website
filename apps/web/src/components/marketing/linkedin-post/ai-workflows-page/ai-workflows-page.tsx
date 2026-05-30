import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { AiWorkflowsHeroSection } from "@/components/marketing/linkedin-post/hero-section/hero-section";
import { ExampleSection } from "@/components/marketing/linkedin-post/example-section/example-section";
import { GeneratorSection } from "@/components/marketing/linkedin-post/generator-section/generator-section";
import { WorkflowShowcaseSection } from "@/components/marketing/linkedin-post/workflow-showcase-section/workflow-showcase-section";
import { PrivacyNoteSection } from "@/components/marketing/linkedin-post/privacy-note-section/privacy-note-section";
import { ProblemExamplesSection } from "@/components/marketing/linkedin-post/problem-examples-section/problem-examples-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { FOOTER_SECTION_ID } from "@/config/navigation/home";
import {
  LINKEDIN_POST_HEADER_NAVIGATION,
  LINKEDIN_POST_SECTION_HREFS,
} from "@/config/navigation/linkedin-post";
import { SITE_ROUTES } from "@/config/routes";
import { getLinkedInPostExampleContent } from "@/i18n/dictionaries/linkedin-post/example";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { getLinkedInPostHeroContent } from "@/i18n/dictionaries/linkedin-post/hero";
import { getLinkedInPostPrivacyNoteContent } from "@/i18n/dictionaries/linkedin-post/privacy-note";
import { getLinkedInPostProblemExamplesContent } from "@/i18n/dictionaries/linkedin-post/problem-examples";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";

type LinkedInPostPageProps = {
  locale: Locale;
};

export function LinkedInPostPage({ locale }: LinkedInPostPageProps) {
  const hero = getLinkedInPostHeroContent(locale);
  const problemExamples = getLinkedInPostProblemExamplesContent(locale);
  const example = getLinkedInPostExampleContent(locale);
  const generator = getLinkedInPostGeneratorContent(locale);
  const privacyNote = getLinkedInPostPrivacyNoteContent(locale);
  const footer = getLandingFooterContent(locale);
  const privacyHref = `/${locale}${SITE_ROUTES.PRIVACY}`;

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
          secondaryCtaHref={LINKEDIN_POST_SECTION_HREFS.example}
          trackingLocation="linkedin_post_hero"
        />

        <ProblemExamplesSection
          id={LINKEDIN_POST_SECTION_HREFS.problem.slice(1)}
          locale={locale}
          {...problemExamples}
        />

        <ExampleSection
          {...example}
          generatorHref={LINKEDIN_POST_SECTION_HREFS.generator}
          id={LINKEDIN_POST_SECTION_HREFS.example.slice(1)}
          locale={locale}
        />

        <GeneratorSection
          content={generator}
          id={LINKEDIN_POST_SECTION_HREFS.generator.slice(1)}
          locale={locale}
        />

        <WorkflowShowcaseSection
          {...generator.customPost}
          id={LINKEDIN_POST_SECTION_HREFS.workflow.slice(1)}
          locale={locale}
        />

        <PrivacyNoteSection
          {...privacyNote}
          id={LINKEDIN_POST_SECTION_HREFS.privacy.slice(1)}
          privacyHref={privacyHref}
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
