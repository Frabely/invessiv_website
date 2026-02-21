import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { CasesSection } from "@/components/sections/home/cases-section";
import { DeliveryFlowSection } from "@/components/sections/home/delivery-flow-section";
import { DifferenceSection } from "@/components/sections/home/difference-section";
import { FoundationSection } from "@/components/sections/home/foundation-section";
import { HeroSection } from "@/components/sections/home/hero-section";
import { PortalSection } from "@/components/sections/home/portal-section";
import { PricingSection } from "@/components/sections/home/pricing-section";
import { SignatureShell } from "@/components/sections/home/signature-shell";
import { getRequestI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestI18n();
  return {
    title: dictionary.pages.home.metaTitle,
    description: dictionary.pages.home.metaDescription,
  };
}

export default async function HomePage() {
  const { dictionary } = await getRequestI18n();

  return (
    <SignatureShell>
      <Reveal delayMs={20}>
        <HeroSection
          badge={dictionary.pages.home.badge}
          title={dictionary.pages.home.title}
          description={dictionary.pages.home.description}
          primaryCta={dictionary.cta.primary}
          secondaryCta={dictionary.cta.secondary}
        />
      </Reveal>
      <Reveal delayMs={40}>
        <DifferenceSection
          heading={dictionary.pages.home.differenceHeading}
          hint={dictionary.pages.home.differenceHint}
          items={dictionary.pages.home.differenceItems}
        />
      </Reveal>
      <Reveal delayMs={60}>
        <FoundationSection
          heading={dictionary.pages.home.foundationHeading}
          items={dictionary.pages.home.foundationItems}
        />
      </Reveal>
      <Reveal delayMs={80}>
        <DeliveryFlowSection
          heading={dictionary.pages.home.flowHeading}
          hint={dictionary.pages.home.flowHint}
          steps={dictionary.pages.home.flowSteps}
        />
      </Reveal>
      <Reveal delayMs={100}>
        <CasesSection
          heading={dictionary.pages.home.casesHeading}
          hint={dictionary.pages.home.casesHint}
          labels={dictionary.pages.home.caseLabels}
          cases={dictionary.pages.home.cases}
        />
      </Reveal>
      <Reveal delayMs={120}>
        <PricingSection
          heading={dictionary.pages.home.pricingHeading}
          hint={dictionary.pages.home.pricingHint}
          plans={dictionary.pages.home.pricingPlans}
          mockNote={dictionary.pages.home.pricingMockNote}
          buttonLabel={dictionary.pages.home.pricingButton}
        />
      </Reveal>
      <Reveal delayMs={140}>
        <PortalSection
          heading={dictionary.pages.home.portalHeading}
          hint={dictionary.pages.home.portalHint}
          loginLabel={dictionary.pages.home.portalLoginButton}
          registerLabel={dictionary.pages.home.portalRegisterButton}
          contactHeading={dictionary.pages.home.portalContactHeading}
          contactHint={dictionary.pages.home.portalContactHint}
          goalPlaceholder={dictionary.pages.home.portalGoalPlaceholder}
          audiencePlaceholder={dictionary.pages.home.portalAudiencePlaceholder}
          deadlinePlaceholder={dictionary.pages.home.portalDeadlinePlaceholder}
          messagePlaceholder={dictionary.pages.home.portalMessagePlaceholder}
          mockNote={dictionary.pages.home.portalMockNote}
        />
      </Reveal>
    </SignatureShell>
  );
}
