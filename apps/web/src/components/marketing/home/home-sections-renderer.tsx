import type { RefObject } from "react";

import { ContactSection } from "@/components/marketing/home/sections/contact-section/contact-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { ProofSection } from "@/components/marketing/home/sections/proof-section/proof-section";
import { ProcessSection } from "@/components/marketing/home/sections/process-section/process-section";
import { QAndASection } from "@/components/marketing/home/sections/q-and-a-section/q-and-a-section";
import { ServicesSection } from "@/components/marketing/home/sections/services-section/services-section";
import { TrustOutcomeBridgeSection } from "@/components/marketing/home/sections/trust-outcome-bridge-section/trust-outcome-bridge-section";
import { LayoutShell } from "@/components/marketing/shared/layout-shell/layout-shell";
import {
  CONTACT_SECTION_ID,
  FAQ_SECTION_ID,
  FOOTER_SECTION_ID,
  HERO_SECTION_ID,
  LEAD_BRIDGE_SECTION_ID,
  PROCESS_SECTION_ID,
  PROOF_SECTION_ID,
  SECTION_IDS,
  SERVICES_SECTION_ID,
} from "@/config/navigation/home";
import type { HomeSectionContent } from "@/i18n/dictionaries/marketing/home";
import type { HomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import type { ValidationResult } from "@/lib/navigation/validate-navigation-sections";

type HomeSectionsRendererProps = {
  landingPageServiceHref: string;
  sections: HomeSectionContent[];
  servicesSectionRef: RefObject<HTMLElement | null>;
  showProofSection: boolean;
  ui: HomeUiContent;
  validation: ValidationResult;
};

export function HomeSectionsRenderer({
  landingPageServiceHref,
  sections,
  servicesSectionRef,
  showProofSection,
  ui,
  validation,
}: HomeSectionsRendererProps) {
  type ContentSectionId = HomeSectionContent["id"];
  const getSectionById = <Id extends ContentSectionId>(sectionId: Id) =>
    sections.find(
      (section): section is Extract<HomeSectionContent, { id: Id }> =>
        section.id === sectionId,
    );
  const servicesSection = getSectionById(SERVICES_SECTION_ID);
  const footerSection = getSectionById(FOOTER_SECTION_ID);

  if (!servicesSection || !footerSection) {
    throw new Error("Expected services and footer sections to be available.");
  }

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

        {SECTION_IDS.filter(
          (id) => id !== HERO_SECTION_ID && id !== FOOTER_SECTION_ID,
        ).map((id) => {
          if (id === LEAD_BRIDGE_SECTION_ID) {
            return (
              <TrustOutcomeBridgeSection
                content={ui.leadBridgeContent}
                id={id}
                key={id}
              />
            );
          }

          const section = getSectionById(id);
          if (!section) {
            return null;
          }

          if (section.id === SERVICES_SECTION_ID) {
            return (
              <ServicesSection
                addonBadgeLabel={ui.servicesAddonBadgeLabel}
                deliveryLabel={ui.servicesDeliveryLabel}
                detailPageCtaLabel={ui.servicesDetailPageCta}
                id={section.id}
                key={section.id}
                kicker={ui.servicesKicker}
                launchAddonTitle={ui.servicesLaunchAddonTitle}
                otherServicesTitle={ui.servicesOtherTitle}
                primaryCtaLabel={ui.servicesPrimaryCta}
                primaryCtaLabels={ui.servicesPrimaryCtaLabels}
                recommendedBadgeLabel={ui.servicesRecommendedBadgeLabel}
                sectionRef={servicesSectionRef}
                serviceCards={section.serviceCards}
                serviceContextNote={section.serviceContextNote}
                serviceDetailHrefs={{
                  landing: landingPageServiceHref,
                }}
                serviceOptions={ui.servicesIntentOptions}
                servicePickerTitle={ui.servicesIntentTitle}
                serviceSecondaryTitle={section.serviceSecondaryTitle}
                title={section.title}
              />
            );
          }

          if (section.id === PROOF_SECTION_ID) {
            if (!showProofSection) {
              return null;
            }

            return (
              <ProofSection
                description={section.description}
                featuredProject={section.proofFeaturedProject}
                highlightsAriaLabel={ui.proofHighlightsAriaLabel}
                id={section.id}
                key={section.id}
                moreProjects={section.proofMoreProjects}
                ratingAriaLabel={
                  section.proofRatingAriaLabel ?? ui.proofRatingAriaLabel
                }
                reviewLinkLabel={
                  section.proofReviewLinkLabel ?? ui.proofReviewLinkLabel
                }
                reviews={section.proofReviews}
                summaryPoints={section.summaryPoints}
                title={section.title}
              />
            );
          }

          if (section.id === PROCESS_SECTION_ID) {
            return (
              <ProcessSection
                description={section.description}
                id={section.id}
                key={section.id}
                processCta={section.processCta}
                processSteps={section.processSteps}
                summaryPoints={section.summaryPoints}
                title={section.title}
              />
            );
          }

          if (section.id === FAQ_SECTION_ID) {
            return (
              <QAndASection
                description={section.description}
                id={section.id}
                items={section.qnaItems}
                key={section.id}
                secondaryContact={section.qnaSecondaryContact}
                title={section.title}
              />
            );
          }

          if (section.id === CONTACT_SECTION_ID) {
            const contactFormOffers = servicesSection.serviceCards.map(
              (card) => ({
                key: card.key,
                title: card.title,
              }),
            );
            const privacyHref = footerSection.footerLegalLinks.find((link) =>
              /privacy|datenschutz/i.test(link.label),
            )?.href;

            if (!privacyHref) {
              throw new Error("Expected footer privacy link for contact form.");
            }

            return (
              <ContactSection
                contactAlternativeLabel={section.contactAlternativeLabel}
                contactChannels={section.contactChannels}
                contactDecisionIntro={section.contactDecisionIntro}
                contactForm={section.contactForm}
                contactFormOffers={contactFormOffers}
                quickContactForm={section.quickContactForm}
                discoveryCallForm={section.discoveryCallForm}
                contactSecondaryCta={section.contactSecondaryCta}
                id={section.id}
                key={section.id}
                privacyHref={privacyHref}
                title={section.title}
              />
            );
          }

          return null;
        })}
      </LayoutShell>

      <FooterSection
        bottomNote={footerSection.footerBottomNote}
        brand={footerSection.footerBrand}
        columns={footerSection.footerColumns}
        copyright={footerSection.footerCopyright}
        description={footerSection.description}
        id={FOOTER_SECTION_ID}
        legalLinks={footerSection.footerLegalLinks}
        socialLinks={footerSection.footerSocialLinks}
      />
    </>
  );
}
