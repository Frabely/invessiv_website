import type { Metadata } from "next";
import { DeliveryFlowSection } from "@/components/sections/home/delivery-flow-section";
import { FoundationSection } from "@/components/sections/home/foundation-section";
import { HeroSection } from "@/components/sections/home/hero-section";
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
    <>
      <HeroSection
        badge={dictionary.pages.home.badge}
        title={dictionary.pages.home.title}
        description={dictionary.pages.home.description}
        primaryCta={dictionary.cta.primary}
        secondaryCta={dictionary.cta.secondary}
      />
      <FoundationSection
        heading={dictionary.pages.home.foundationHeading}
        items={dictionary.pages.home.foundationItems}
      />
      <DeliveryFlowSection
        heading={dictionary.pages.home.flowHeading}
        steps={dictionary.pages.home.flowSteps}
      />
    </>
  );
}
