import type { Metadata } from "next";
import { PageIntroCard } from "@/components/sections/shared/page-intro-card";
import { TemplateProductsSection } from "@/components/sections/vorlagen/template-products-section";
import { getRequestI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestI18n();
  return {
    title: dictionary.pages.vorlagen.metaTitle,
    description: dictionary.pages.vorlagen.metaDescription,
  };
}

export default async function VorlagenPage() {
  const { dictionary } = await getRequestI18n();

  return (
    <>
      <PageIntroCard
        badge={dictionary.pages.vorlagen.badge}
        title={dictionary.pages.vorlagen.title}
        description={dictionary.pages.vorlagen.description}
        hint={dictionary.pages.vorlagen.hint}
        primaryAction={{ href: "/kontakt", label: dictionary.cta.secondary }}
        secondaryAction={{ href: "/leistungen", label: dictionary.cta.primary }}
      />
      <TemplateProductsSection
        heading={dictionary.pages.vorlagen.sectionHeading}
        ctaLabel={dictionary.cta.secondary}
        products={dictionary.offers.templateProducts}
      />
    </>
  );
}
