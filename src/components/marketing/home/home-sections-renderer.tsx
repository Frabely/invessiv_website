import type { RefObject } from "react";

import { ContactSection } from "@/components/marketing/home/sections/contact-section/contact-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { IncludedSection } from "@/components/marketing/home/sections/included-section/included-section";
import { PlaceholderSection } from "@/components/marketing/home/sections/placeholder-section/placeholder-section";
import { ProofSection } from "@/components/marketing/home/sections/proof-section/proof-section";
import { ProcessSection } from "@/components/marketing/home/sections/process-section/process-section";
import { QAndASection } from "@/components/marketing/home/sections/q-and-a-section/q-and-a-section";
import { ServicesSection } from "@/components/marketing/home/sections/services-section/services-section";
import { LayoutShell } from "@/components/marketing/shared/layout-shell/layout-shell";
import { SECTION_IDS } from "@/config/site";
import type { HomeSectionContent } from "@/i18n/dictionaries/marketing/home";
import type { HomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import type { ValidationResult } from "@/lib/navigation/validate-navigation-sections";

type HomeSectionsRendererProps = {
  sections: HomeSectionContent[];
  servicesSectionRef: RefObject<HTMLElement | null>;
  showProofSection: boolean;
  ui: HomeUiContent;
  validation: ValidationResult;
};

export function HomeSectionsRenderer({
  sections,
  servicesSectionRef,
  showProofSection,
  ui,
  validation,
}: HomeSectionsRendererProps) {
  const getSectionById = (sectionId: (typeof SECTION_IDS)[number]) =>
    sections.find((section) => section.id === sectionId);
  const servicesSection = getSectionById("services");
  const footerSection = getSectionById("footer");

  return (
    <>
      <LayoutShell>
        {!validation.hasCompleteMapping ? (
          <p
            className="mb-6 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-950"
            role="status"
          >
            {ui.mappingWarning}
          </p>
        ) : null}

        {SECTION_IDS.filter((id) => id !== "hero" && id !== "footer").map(
          (id) => {
            const section = getSectionById(id);
            if (!section) {
              return null;
            }

            if (section.id === "included") {
              return (
                <IncludedSection
                  id={section.id}
                  key={section.id}
                  includedContent={ui.includedContent}
                />
              );
            }

            if (section.id === "services") {
              return (
                <ServicesSection
                  addonBadgeLabel={ui.servicesAddonBadgeLabel}
                  deliveryLabel={ui.servicesDeliveryLabel}
                  detailsCtaLabel={ui.servicesDetailsCta}
                  fitLabel={ui.servicesFitLabel}
                  goalOptions={ui.servicesIntentOptions}
                  goalTitle={ui.servicesIntentTitle}
                  id={section.id}
                  key={section.id}
                  moreItemsPluralLabel={ui.servicesMoreItemsPluralLabel}
                  moreItemsSingularLabel={ui.servicesMoreItemsSingularLabel}
                  primaryCtaLabel={ui.servicesPrimaryCta}
                  primaryCtaLabels={ui.servicesPrimaryCtaLabels}
                  recommendedBadgeLabel={ui.servicesRecommendedBadgeLabel}
                  sectionRef={servicesSectionRef}
                  serviceCards={section.serviceCards ?? []}
                  serviceContextNote={section.serviceContextNote}
                  serviceSecondaryTitle={section.serviceSecondaryTitle}
                  title={section.title}
                />
              );
            }

            if (section.id === "proof") {
              if (!showProofSection) {
                return null;
              }

              return (
                <ProofSection
                  description={section.description}
                  featuredProjectFallbackLabel={
                    ui.proofFeaturedProjectFallbackLabel
                  }
                  featuredProject={section.proofFeaturedProject}
                  highlightsAriaLabel={ui.proofHighlightsAriaLabel}
                  id={section.id}
                  key={section.id}
                  moreProjectsFallbackCtaLabel={
                    ui.proofMoreProjectsFallbackCtaLabel
                  }
                  moreProjectsFallbackHref={ui.proofMoreProjectsFallbackHref}
                  moreProjectsFallbackTitle={ui.proofMoreProjectsFallbackTitle}
                  moreProjects={section.proofMoreProjects}
                  ratingAriaLabel={
                    section.proofRatingAriaLabel ?? ui.proofRatingAriaLabel
                  }
                  reviewLinkLabel={
                    section.proofReviewLinkLabel ?? ui.proofReviewLinkLabel
                  }
                  reviews={section.proofReviews ?? []}
                  summaryPoints={section.summaryPoints}
                  title={section.title}
                />
              );
            }

            if (section.id === "process") {
              return (
                <ProcessSection
                  description={section.description}
                  id={section.id}
                  key={section.id}
                  processCta={section.processCta}
                  processSteps={section.processSteps ?? []}
                  summaryPoints={section.summaryPoints}
                  title={section.title}
                />
              );
            }

            if (section.id === "faq") {
              return (
                <QAndASection
                  description={section.description}
                  id={section.id}
                  items={section.qnaItems ?? []}
                  key={section.id}
                  secondaryContact={section.qnaSecondaryContact}
                  summaryPoints={section.summaryPoints}
                  title={section.title}
                />
              );
            }

            if (section.id === "contact") {
              const contactFormOffers =
                servicesSection?.serviceCards?.map((card) => ({
                  key: card.key,
                  title: card.title,
                })) ?? [];
              const privacyHref =
                footerSection?.footerLegalLinks?.find((link) =>
                  /privacy|datenschutz/i.test(link.label),
                )?.href ?? "/privacy";

              return (
                <ContactSection
                  contactCta={section.contactCta}
                  contactChannels={section.contactChannels ?? []}
                  contactDecisionIntro={section.contactDecisionIntro}
                  contactForm={section.contactForm}
                  contactFormOffers={contactFormOffers}
                  contactSecondaryCta={section.contactSecondaryCta}
                  description={section.description}
                  id={section.id}
                  key={section.id}
                  privacyHref={privacyHref}
                  title={section.title}
                />
              );
            }

            return (
              <PlaceholderSection
                description={section.description}
                id={section.id}
                isTall={false}
                key={section.id}
                title={section.title}
              />
            );
          },
        )}
      </LayoutShell>

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
