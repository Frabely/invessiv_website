import type { RefObject } from "react";

import { ContactSection } from "@/components/marketing/home/sections/contact-section/contact-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { PackagesSection } from "@/components/marketing/home/sections/packages-section/packages-section";
import { PlaceholderSection } from "@/components/marketing/home/sections/placeholder-section/placeholder-section";
import { ProcessSection } from "@/components/marketing/home/sections/process-section/process-section";
import { ProofSection } from "@/components/marketing/home/sections/proof-section/proof-section";
import { ServicesSection } from "@/components/marketing/home/sections/services-section/services-section";
import { SECTION_IDS } from "@/config/site";
import type { HomeSectionContent } from "@/content/landing/home";
import type { HomeUiContent } from "@/content/landing/home-ui";
import type { ValidationResult } from "@/lib/navigation/validate-navigation-sections";

type HomeSectionsRendererProps = {
  processDotRef: RefObject<SVGCircleElement | null>;
  processPathRef: RefObject<SVGPathElement | null>;
  processSectionRef: RefObject<HTMLElement | null>;
  processStepsRef: RefObject<HTMLDivElement | null>;
  sections: HomeSectionContent[];
  servicesSectionRef: RefObject<HTMLElement | null>;
  ui: HomeUiContent;
  validation: ValidationResult;
};

export function HomeSectionsRenderer({
  processDotRef,
  processPathRef,
  processSectionRef,
  processStepsRef,
  sections,
  servicesSectionRef,
  ui,
  validation,
}: HomeSectionsRendererProps) {
  const getSectionById = (sectionId: (typeof SECTION_IDS)[number]) =>
    sections.find((section) => section.id === sectionId);
  const footerSection = getSectionById("footer");

  return (
    <>
      <div className="layout-shell">
        {!validation.hasCompleteMapping ? (
          <p className="phase-zero-warning" role="status">
            {ui.mappingWarning}
          </p>
        ) : null}

        {SECTION_IDS.filter((id) => id !== "hero" && id !== "footer").map((id) => {
          const section = getSectionById(id);
          if (!section) {
            return null;
          }

          if (section.id === "proof") {
            return (
              <ProofSection
                id={section.id}
                key={section.id}
                proofContent={ui.proofContent}
              />
            );
          }

          if (section.id === "services") {
            return (
              <ServicesSection
                description={section.description}
                id={section.id}
                key={section.id}
                sectionRef={servicesSectionRef}
                serviceCards={section.serviceCards ?? []}
                servicesExampleCta={ui.servicesExampleCta}
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
                processDotRef={processDotRef}
                processPathRef={processPathRef}
                processRoles={section.processRoles ?? []}
                processSectionRef={processSectionRef}
                processSteps={section.processSteps ?? []}
                processStepsRef={processStepsRef}
                summary={section.processSummary}
                title={section.title}
              />
            );
          }

          if (section.id === "pricing") {
            return (
              <PackagesSection
                assurances={section.packageAssurances}
                description={section.description}
                disclaimer={section.packageDisclaimer}
                id={section.id}
                key={section.id}
                packageCards={section.packageCards ?? []}
                sectionCta={section.packageSectionCta}
                summary={section.packageSummary}
                title={section.title}
              />
            );
          }

          if (section.id === "contact") {
            return (
              <ContactSection
                channels={section.contactChannels ?? []}
                checklist={section.contactChecklist ?? []}
                checklistHint={section.contactChecklistHint}
                checklistTitle={section.contactChecklistTitle ?? ""}
                contactCta={section.contactCta}
                description={section.description}
                id={section.id}
                key={section.id}
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
        })}
      </div>

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
