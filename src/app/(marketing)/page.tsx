"use client";

import { useRef } from "react";
import { HeroSection } from "@/components/marketing/home/hero-section";
import { MarqueeSection } from "@/components/marketing/home/marquee-section";
import { PlaceholderSection } from "@/components/marketing/home/placeholder-section";
import { ProcessSection } from "@/components/marketing/home/process-section";
import { ProofSection } from "@/components/marketing/home/proof-section";
import { ServicesSection } from "@/components/marketing/home/services-section";
import { SiteHeader } from "@/components/marketing/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { getHomeSections } from "@/content/landing/home";
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
  const proofContent =
    locale === "de"
      ? {
          title: "Warum nicht wie eine Standard-Template-Seite?",
          hint: "Der Fokus liegt auf schneller Lieferung, wenig Aufwand fuer den Kaeufer und messbaren Ergebnissen.",
          cta: "Leistungen ansehen",
          kpis: [
            { value: "5", suffix: " Tage", label: "Time-to-first-draft" },
            { value: "92", suffix: "%", label: "Briefing-Aufwand reduziert" },
            {
              value: "1",
              suffix: " Ansprechpartner",
              label: "Klarer Delivery-Owner",
            },
          ],
          cards: [
            {
              title: "Time-to-Launch SLA",
              tag: "Fast",
              description:
                "Erste klickbare Version in 5 Werktagen, klarer Go-live Plan je Paket.",
            },
            {
              title: "Upgrade statt Neubau",
              tag: "Lean",
              description:
                "Bestehende Seiten werden gezielt modernisiert, ohne alles neu aufzusetzen.",
            },
            {
              title: "KPI-orientiert",
              tag: "Measured",
              description:
                "Vorab definierte Ziele wie Ladezeit, Leads oder Conversion statt nur Design-Output.",
            },
          ],
        }
      : {
          title: "Why not build it like a generic template site?",
          hint: "The focus is fast delivery, low buyer effort, and measurable outcomes.",
          cta: "View services",
          kpis: [
            { value: "5", suffix: " days", label: "Time-to-first-draft" },
            { value: "92", suffix: "%", label: "Briefing effort reduced" },
            { value: "1", suffix: " owner", label: "Clear delivery owner" },
          ],
          cards: [
            {
              title: "Time-to-launch SLA",
              tag: "Fast",
              description:
                "First clickable version in 5 business days with a clear go-live plan per package.",
            },
            {
              title: "Upgrade over rebuild",
              tag: "Lean",
              description:
                "Existing pages are modernized surgically without forcing a full rebuild.",
            },
            {
              title: "KPI-oriented",
              tag: "Measured",
              description:
                "Predefined targets like speed, leads, and conversion instead of design output only.",
            },
          ],
        };

  const marqueeItems =
    locale === "de"
      ? [
          "B2B Services",
          "Growth Ops",
          "Lead Funnels",
          "CRO Sprints",
          "SEO Grundlagen",
          "Paid + Organic",
          "CRM Integrationen",
          "Tracking Klarheit",
        ]
      : [
          "B2B Services",
          "Growth Ops",
          "Lead Funnels",
          "CRO Sprints",
          "SEO Foundations",
          "Paid + Organic",
          "CRM Integrations",
          "Tracking Clarity",
        ];

  const heroTag =
    locale === "de"
      ? "Individuell statt Baukasten"
      : "Custom instead of templates";
  const heroPrimaryCta =
    locale === "de" ? "Projekt anfragen" : "Request project";
  const heroSecondaryCta =
    locale === "de" ? "Leistungen ansehen" : "View services";
  const servicesExampleCta = locale === "de" ? "Mehr erfahren" : "Learn more";
  const heroChipTags =
    locale === "de"
      ? ["Figma-Design inkl.", "Launch in Tagen", "Antwort < 24h"]
      : ["Figma design included", "Launch in days", "Reply < 24h"];

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
          heroChipTags={heroChipTags}
          heroPrimaryCta={heroPrimaryCta}
          heroSecondaryCta={heroSecondaryCta}
          heroTag={heroTag}
          title={sections[0]?.title ?? ""}
        />

        <MarqueeSection items={marqueeItems} />

        <div className="layout-shell">
          {!validation.hasCompleteMapping ? (
            <p className="phase-zero-warning" role="status">
              {locale === "de"
                ? "Navigation/Section Mapping ist unvollstaendig."
                : "Navigation/section mapping is incomplete."}
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
                  proofContent={proofContent}
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
                  servicesExampleCta={servicesExampleCta}
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
