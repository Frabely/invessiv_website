import type { Metadata } from "next";
import { ServicePackagesSection } from "@/components/sections/leistungen/service-packages-section";
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
      <section className="mx-auto w-full max-w-[1080px] px-4 pb-3 pt-5">
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {dictionary.pages.leistungen.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
          {dictionary.pages.leistungen.description}
        </p>
      </section>
      <ServicePackagesSection
        heading={dictionary.pages.leistungen.sectionHeading}
        ctaLabel={dictionary.cta.primary}
        packages={dictionary.offers.servicePackages}
      />
    </>
  );
}
