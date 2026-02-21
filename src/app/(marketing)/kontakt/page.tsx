import type { Metadata } from "next";
import { ContactOptionsSection } from "@/components/sections/kontakt/contact-options-section";
import { ContactRequestForm } from "@/components/sections/kontakt/contact-request-form";
import { PageIntroCard } from "@/components/sections/shared/page-intro-card";
import { getRequestI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestI18n();
  return {
    title: dictionary.pages.kontakt.metaTitle,
    description: dictionary.pages.kontakt.metaDescription,
  };
}

export default async function KontaktPage() {
  const { dictionary } = await getRequestI18n();
  const form = dictionary.pages.kontakt.form;

  return (
    <>
      <PageIntroCard
        badge={dictionary.pages.kontakt.badge}
        title={dictionary.pages.kontakt.title}
        description={dictionary.pages.kontakt.description}
        hint={dictionary.pages.kontakt.hint}
        primaryAction={{ href: "/kontakt", label: dictionary.cta.primary }}
        secondaryAction={{ href: "/vorlagen", label: dictionary.cta.secondary }}
      />
      <ContactOptionsSection
        heading={dictionary.pages.kontakt.optionsHeading}
        description={dictionary.pages.kontakt.optionsDescription}
        primaryCta={dictionary.cta.primary}
        emailLabel={dictionary.pages.kontakt.emailLabel}
      />
      <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-3">
        <ContactRequestForm
          title={form.title}
          description={form.description}
          nameLabel={form.nameLabel}
          emailLabel={form.emailLabel}
          messageLabel={form.messageLabel}
          submitLabel={form.submitLabel}
          successMessage={form.successMessage}
          errors={form.errors}
        />
      </section>
    </>
  );
}
