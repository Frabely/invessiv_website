import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal/legal-layout/legal-layout";
import { COMPANY, COMPANY_ADDRESS_LINE_DE, COMPANY_ADDRESS_LINE_EN } from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_URL } from "@/lib/site-metadata";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const terms = dict.terms;

  return {
    title: terms.meta.title,
    description: terms.meta.description,
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        de: "/de/terms",
        en: "/en/terms",
      },
    },
    openGraph: {
      title: terms.meta.openGraphTitle,
      description: terms.meta.description,
      url: `${SITE_URL}/${locale}/terms`,
      locale: terms.meta.openGraphLocale,
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const terms = dict.terms;
  const addressLine = locale === "de" ? COMPANY_ADDRESS_LINE_DE : COMPANY_ADDRESS_LINE_EN;

  return (
    <LegalLayout
      lead={terms.page.lead}
      locale={locale}
      title={terms.page.title}
      updatedAt={terms.page.updatedAt}
    >
      <section className="legal-content-card">
        <div className="legal-content-card__group">
          <h3>{terms.sections.provider.title}</h3>
          <p>
            {terms.sections.provider.contractPrefix} {COMPANY.brandName},{" "}
            {terms.sections.provider.representedByLabel} {COMPANY.owner}, {addressLine}.
          </p>
        </div>

        <div className="legal-content-card__group">
          <h3>{terms.sections.scope.title}</h3>
          <p>{terms.sections.scope.body}</p>
        </div>

        <div className="legal-content-card__group">
          <h3>{terms.sections.services.title}</h3>
          <p>{terms.sections.services.body}</p>
        </div>

        <div className="legal-content-card__group">
          <h3>{terms.sections.payment.title}</h3>
          <p>{terms.sections.payment.body}</p>
        </div>

        <div className="legal-content-card__group">
          <h3>{terms.sections.usageRights.title}</h3>
          <p>{terms.sections.usageRights.body}</p>
        </div>
      </section>
    </LegalLayout>
  );
}