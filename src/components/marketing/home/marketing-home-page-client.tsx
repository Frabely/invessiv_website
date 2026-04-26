"use client";

import { useRef } from "react";
import { HomeSectionsRenderer } from "@/components/marketing/home/home-sections-renderer";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import {
  PRIMARY_NAVIGATION,
  PRIMARY_NAVIGATION_SECTION_IDS,
  SECTION_HREFS,
} from "@/config/site";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { useAnchorOffsetScroll } from "@/hooks/marketing/use-anchor-offset-scroll";
import { useServicesCardReveal } from "@/hooks/marketing/use-services-card-reveal";
import { validateNavigationSections } from "@/lib/navigation/validate-navigation-sections";

type MarketingHomePageClientProps = {
  showProofSection: boolean;
};

export function MarketingHomePageClient({
  showProofSection,
}: MarketingHomePageClientProps) {
  const { locale } = useLanguage();
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const sections = getHomeSections(locale);
  const ui = getHomeUiContent(locale);
  const heroSection = sections.find((section) => section.id === "hero");

  if (!heroSection) {
    throw new Error("Expected home hero section to be available.");
  }

  const validation = validateNavigationSections({
    navigationHrefs: PRIMARY_NAVIGATION.map((item) => item.href),
    sectionIds: [...PRIMARY_NAVIGATION_SECTION_IDS],
  });

  useAnchorOffsetScroll();
  useServicesCardReveal(servicesSectionRef, locale);

  return (
    <>
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <HeroSection
          description={heroSection.description}
          heroPrimaryCta={ui.heroPrimaryCta}
          heroSecondaryCta={ui.heroSecondaryCta}
          heroTag={ui.heroTag}
          heroVisualAriaLabel={ui.heroVisualAriaLabel}
          primaryCtaAnalyticsTarget="form"
          primaryCtaHref={SECTION_HREFS.contact}
          secondaryCtaAnalyticsTarget="services"
          secondaryCtaHref={SECTION_HREFS.services}
          title={heroSection.title}
          trackingLocation="hero"
        />

        <HomeSectionsRenderer
          sections={sections}
          servicesSectionRef={servicesSectionRef}
          showProofSection={showProofSection}
          ui={ui}
          validation={validation}
        />
      </main>
    </>
  );
}
