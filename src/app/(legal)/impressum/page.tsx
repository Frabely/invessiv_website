import type { Metadata } from "next";
import { getRequestI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestI18n();
  return {
    title: dictionary.pages.impressum.metaTitle,
    description: dictionary.pages.impressum.metaDescription,
  };
}

export default async function ImpressumPage() {
  const { dictionary } = await getRequestI18n();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
        {dictionary.pages.impressum.title}
      </h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        {dictionary.pages.impressum.description}
      </p>
    </section>
  );
}
