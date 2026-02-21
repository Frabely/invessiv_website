import type { Metadata } from "next";
import { ServicePackagesSection } from "@/components/sections/leistungen/service-packages-section";
import { PageIntroCard } from "@/components/sections/shared/page-intro-card";
import { getRequestI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestI18n();
  return {
    title: dictionary.pages.leistungen.metaTitle,
    description: dictionary.pages.leistungen.metaDescription,
  };
}

export default async function LeistungenPage() {
  const { dictionary } = await getRequestI18n();

  return (
    <>
      <PageIntroCard
        badge={dictionary.pages.leistungen.badge}
        title={dictionary.pages.leistungen.title}
        description={dictionary.pages.leistungen.description}
        hint={dictionary.pages.leistungen.hint}
        primaryAction={{ href: "/kontakt", label: dictionary.cta.primary }}
        secondaryAction={{ href: "/vorlagen", label: dictionary.cta.secondary }}
      />
      <ServicePackagesSection
        heading={dictionary.pages.leistungen.sectionHeading}
        ctaLabel={dictionary.cta.primary}
        packages={dictionary.offers.servicePackages}
      />
    </>
  );
}
