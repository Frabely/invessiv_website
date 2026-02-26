import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal/legal-layout/legal-layout";
import { COMPANY, COMPANY_ADDRESS_LINE_DE, COMPANY_ADDRESS_LINE_EN } from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@/config/i18n";
import { SITE_URL } from "@/lib/site-metadata";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

const termsMeta = {
  de: {
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen von Invessiv.",
    openGraphTitle: "AGB | Invessiv",
  },
  en: {
    title: "Terms",
    description: "General terms and conditions of Invessiv.",
    openGraphTitle: "Terms | Invessiv",
  },
} as const;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const meta = termsMeta[locale];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        de: "/de/terms",
        en: "/en/terms",
      },
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.description,
      url: `${SITE_URL}/${locale}/terms`,
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const contentByLocale: Record<
    Locale,
    { addressLine: string; lead: string; title: string }
  > = {
    de: {
      title: "Allgemeine Geschäftsbedingungen (AGB)",
      lead:
        "Stand: 26. Februar 2026. Diese AGB gelten für Leistungen von Invessiv im Bereich Website-Erstellung, Website-Optimierung und digitale Prozesslösungen.",
      addressLine: COMPANY_ADDRESS_LINE_DE,
    },
    en: {
      title: "General Terms and Conditions",
      lead:
        "Last updated: February 26, 2026. These terms apply to Invessiv services related to website creation, optimization and digital process solutions.",
      addressLine: COMPANY_ADDRESS_LINE_EN,
    },
  };

  const content = contentByLocale[locale];

  return (
    <LegalLayout lead={content.lead} locale={locale} title={content.title}>
      <section>
        <h2>{locale === "de" ? "1. Anbieter" : "1. Provider"}</h2>
        <p>
          {locale === "de"
            ? "Vertragspartner ist"
            : "Contracting party is"}{" "}
          {COMPANY.brandName}, {locale === "de" ? "vertreten durch" : "represented by"}{" "}
          {COMPANY.owner}, {content.addressLine}.
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "2. Geltungsbereich" : "2. Scope"}</h2>
        <p>
          {locale === "de"
            ? "Diese AGB gelten für alle Angebote, Leistungen und Verträge zwischen Invessiv und Unternehmern, sofern nicht ausdrücklich etwas anderes schriftlich vereinbart wurde."
            : "These terms apply to all offers, services and contracts between Invessiv and business customers unless otherwise agreed in writing."}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "3. Leistungen" : "3. Services"}</h2>
        <p>
          {locale === "de"
            ? "Art und Umfang der Leistung ergeben sich aus Angebot, Leistungsbeschreibung und Projektbriefing. Änderungen des Scopes bedürfen einer gesonderten Abstimmung."
            : "Type and scope of the services are defined by offer, scope description and project briefing. Scope changes require separate agreement."}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "4. Vergütung und Zahlungsbedingungen" : "4. Payment terms"}</h2>
        <p>
          {locale === "de"
            ? "Preise ergeben sich aus dem individuellen Angebot. Rechnungen sind ohne Abzug innerhalb von 14 Tagen fällig."
            : "Prices follow the individual offer. Invoices are due within 14 days without deductions."}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "5. Nutzungsrechte" : "5. Usage rights"}</h2>
        <p>
          {locale === "de"
            ? "Mit vollständiger Zahlung erhält der Auftraggeber die vereinbarten Nutzungsrechte an den gelieferten Ergebnissen im vertraglich definierten Umfang."
            : "Upon full payment, the client receives the agreed usage rights for delivered results within the contractually defined scope."}
        </p>
      </section>
    </LegalLayout>
  );
}
