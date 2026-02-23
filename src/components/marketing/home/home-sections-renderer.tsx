import type { RefObject } from "react";

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

  return (
    <div className="layout-shell">
      {!validation.hasCompleteMapping ? (
        <p className="phase-zero-warning" role="status">
          {ui.mappingWarning}
        </p>
      ) : null}

      {SECTION_IDS.filter((id) => id !== "hero").map((id) => {
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

        return (
          <PlaceholderSection
            description={section.description}
            id={section.id}
            isTall={section.id === "pricing" || section.id === "contact"}
            key={section.id}
            title={section.title}
          />
        );
      })}
    </div>
  );
}
