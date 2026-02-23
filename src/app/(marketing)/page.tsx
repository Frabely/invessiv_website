"use client";

import { useRef } from "react";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { MarqueeSection } from "@/components/marketing/home/sections/marquee-section/marquee-section";
import { PlaceholderSection } from "@/components/marketing/home/sections/placeholder-section/placeholder-section";
import { ProcessSection } from "@/components/marketing/home/sections/process-section/process-section";
import { ProofSection } from "@/components/marketing/home/sections/proof-section/proof-section";
import { ServicesSection } from "@/components/marketing/home/sections/services-section/services-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { getHomeSections } from "@/content/landing/home";
import { getHomeUiContent } from "@/content/landing/home-ui";
import { validateNavigationSections } from "@/lib/navigation/validate-navigation-sections";
import { useProcessJourney } from "@/hooks/marketing/use-process-journey";
import { useServicesCardReveal } from "@/hooks/marketing/use-services-card-reveal";

export default function MarketingHomePage() {
  const { locale } = useLanguage();
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const processSectionRef = useRef<HTMLElement | null>(null);
  const processStepsRef = useRef<HTMLDivElement | null>(null);
  const processPathRef = useRef<SVGPathElement | null>(null);
  const processDotRef = useRef<SVGCircleElement | null>(null);
  const sections = getHomeSections(locale);
  const ui = getHomeUiContent(locale);

  const getSectionById = (sectionId: (typeof SECTION_IDS)[number]) =>
    sections.find((section) => section.id === sectionId);

  const validation = validateNavigationSections({
    navigationHrefs: PRIMARY_NAVIGATION.map((item) => item.href),
    sectionIds: SECTION_IDS.filter((id) => id !== "hero"),
  });

  useServicesCardReveal(servicesSectionRef, locale);
  useProcessJourney({
    locale,
    processDotRef,
    processPathRef,
    processSectionRef,
    processStepsRef,
  });

  return (
    <>
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main>
        <div aria-hidden="true" className="page-accents">
          <span className="page-aurora page-aurora--left" />
          <span className="page-aurora page-aurora--right" />
          <span className="page-noise" />
        </div>

        <HeroSection
          description={sections[0]?.description ?? ""}
          heroChipTags={ui.heroChipTags}
          heroPrimaryCta={ui.heroPrimaryCta}
          heroSecondaryCta={ui.heroSecondaryCta}
          heroTag={ui.heroTag}
          title={sections[0]?.title ?? ""}
        />

        <MarqueeSection items={ui.marqueeItems} />

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
      </main>
    </>
  );
}
