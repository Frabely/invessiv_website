import type { Metadata } from "next";
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
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-16">
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {dictionary.pages.vorlagen.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
          {dictionary.pages.vorlagen.description}
        </p>
      </section>
      <TemplateProductsSection
        heading={dictionary.pages.vorlagen.sectionHeading}
        ctaLabel={dictionary.cta.secondary}
        products={dictionary.offers.templateProducts}
      />
    </>
  );
}
