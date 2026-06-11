import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { AiWorkflowsHeroSection } from "@/components/marketing/linkedin-post/hero-section/hero-section";
import { ExampleSection } from "@/components/marketing/linkedin-post/example-section/example-section";
import { GeneratorSection } from "@/components/marketing/linkedin-post/generator-section/generator-section";
import { WorkflowShowcaseSection } from "@/components/marketing/linkedin-post/workflow-showcase-section/workflow-showcase-section";
import { ProblemExamplesSection } from "@/components/marketing/linkedin-post/problem-examples-section/problem-examples-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { FinalCtaSection } from "@/components/shared/final-cta-section/final-cta-section";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import {
  LINKEDIN_POST_HEADER_NAVIGATION,
  LINKEDIN_POST_SECTION_HREFS,
} from "@/config/navigation/linkedin-post";
import { getLinkedInPostHeaderContent } from "@/i18n/dictionaries/linkedin-post/header";
import { getLinkedInPostExampleContent } from "@/i18n/dictionaries/linkedin-post/example";
import { getLinkedInPostFooterContent } from "@/i18n/dictionaries/linkedin-post/footer";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { getLinkedInPostFinalCtaContent } from "@/i18n/dictionaries/linkedin-post/final-cta";
import { getLinkedInPostHeroContent } from "@/i18n/dictionaries/linkedin-post/hero";
import { getLinkedInPostProblemExamplesContent } from "@/i18n/dictionaries/linkedin-post/problem-examples";

type LinkedInPostPageProps = {
  locale: Locale;
};

export function LinkedInPostPage({ locale }: LinkedInPostPageProps) {
  const hero = getLinkedInPostHeroContent(locale);
  const problemExamples = getLinkedInPostProblemExamplesContent(locale);
  const example = getLinkedInPostExampleContent(locale);
  const generator = getLinkedInPostGeneratorContent(locale);
  const finalCta = getLinkedInPostFinalCtaContent(locale);
  const header = getLinkedInPostHeaderContent(locale);
  const footer = getLinkedInPostFooterContent(locale);

  return (
    <>
      <AnchorOffsetScroll />
      <SiteHeader
        ctaHref={LINKEDIN_POST_SECTION_HREFS.generator}
        navigation={LINKEDIN_POST_HEADER_NAVIGATION}
        showThemeSwitch={false}
        uiContent={header}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <AiWorkflowsHeroSection
          {...hero}
          primaryCtaHref={LINKEDIN_POST_SECTION_HREFS.generator}
          secondaryCtaHref={LINKEDIN_POST_SECTION_HREFS.contact}
          trackingLocation="linkedin_post_hero"
        />

        <ProblemExamplesSection
          id={LINKEDIN_POST_SECTION_HREFS.problem.slice(1)}
          locale={locale}
          {...problemExamples}
        />

        <ExampleSection
          {...example}
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

        <FinalCtaSection
          analyticsLocation="linkedin_post_final_cta"
          formId="linkedin_post_final_cta"
          id={LINKEDIN_POST_SECTION_HREFS.contact.slice(1)}
          locale={locale}
          origin={ContactSubmissionOrigin.LinkedInPost}
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
