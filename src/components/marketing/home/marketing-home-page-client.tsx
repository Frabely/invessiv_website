"use client";

import { useRef } from "react";
import { HomeSectionsRenderer } from "@/components/marketing/home/home-sections-renderer";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { MarqueeSection } from "@/components/marketing/home/sections/marquee-section/marquee-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { useServicesCardReveal } from "@/hooks/marketing/use-services-card-reveal";
import { validateNavigationSections } from "@/lib/navigation/validate-navigation-sections";

export function MarketingHomePageClient() {
  const { locale } = useLanguage();
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const sections = getHomeSections(locale);
  const ui = getHomeUiContent(locale);

  const validation = validateNavigationSections({
    navigationHrefs: PRIMARY_NAVIGATION.map((item) => item.href),
    sectionIds: SECTION_IDS.filter((id) => id !== "hero" && id !== "footer"),
  });

  useServicesCardReveal(servicesSectionRef, locale);

  return (
    <>
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main className="marketing-main">
        <div aria-hidden="true" className="page-accents">
          <span className="page-aurora page-aurora--left" />
          <span className="page-aurora page-aurora--right" />
          <span className="page-noise" />
        </div>

        <HeroSection
          description={sections[0]?.description ?? ""}
          heroBenefitsAriaLabel={ui.heroBenefitsAriaLabel}
          heroChipTags={ui.heroChipTags}
          heroPrimaryCta={ui.heroPrimaryCta}
          heroSecondaryCta={ui.heroSecondaryCta}
          heroTag={ui.heroTag}
          heroVisualAriaLabel={ui.heroVisualAriaLabel}
          title={sections[0]?.title ?? ""}
        />

        <MarqueeSection items={ui.marqueeItems} />

        <HomeSectionsRenderer
          sections={sections}
          servicesSectionRef={servicesSectionRef}
          ui={ui}
          validation={validation}
        />
      </main>
    </>
  );
}
