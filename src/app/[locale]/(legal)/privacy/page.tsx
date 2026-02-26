import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal/legal-layout/legal-layout";
import {
  COMPANY,
  COMPANY_ADDRESS_LINE_DE,
  COMPANY_ADDRESS_LINE_EN,
  COMPANY_MAILTO,
  COMPANY_TEL,
} from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@/config/i18n";
import { SITE_URL } from "@/lib/site-metadata";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

const privacyMeta = {
  de: {
    title: "Datenschutz",
    description: "Datenschutzerklärung von Invessiv.",
    openGraphTitle: "Datenschutz | Invessiv",
  },
  en: {
    title: "Privacy",
    description: "Privacy policy of Invessiv.",
    openGraphTitle: "Privacy | Invessiv",
  },
} as const;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const meta = privacyMeta[locale];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        de: "/de/privacy",
        en: "/en/privacy",
      },
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.description,
      url: `${SITE_URL}/${locale}/privacy`,
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const contentByLocale: Record<
    Locale,
    { addressLine: string; lead: string; title: string }
  > = {
    de: {
      title: "Datenschutzerklärung",
      lead:
        "Stand: 26. Februar 2026. Diese Erklärung informiert über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf dieser Website.",
      addressLine: COMPANY_ADDRESS_LINE_DE,
    },
    en: {
      title: "Privacy Policy",
      lead:
        "Last updated: February 26, 2026. This policy explains what personal data we process, why we process it, and how we handle it on this website.",
      addressLine: COMPANY_ADDRESS_LINE_EN,
    },
  };

  const content = contentByLocale[locale];

  return (
    <LegalLayout lead={content.lead} locale={locale} slug="privacy" title={content.title}>
      <section>
        <h2>{locale === "de" ? "1. Verantwortliche Stelle" : "1. Controller"}</h2>
        <p>
          {COMPANY.brandName}, {locale === "de" ? "Inhaber" : "Owner"}: {COMPANY.owner}
          <br />
          {content.addressLine}
          <br />
          E-Mail: <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          <br />
          {locale === "de" ? "Telefon" : "Phone"}:{" "}
          <a href={COMPANY_TEL}>
            {locale === "de" ? COMPANY.contact.phoneDisplayDe : COMPANY.contact.phoneDisplayEn}
          </a>
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "2. Hosting und Server-Logfiles" : "2. Hosting and server logs"}</h2>
        <p>
          {locale === "de"
            ? "Beim Aufruf der Website verarbeitet der Hosting-Provider technisch notwendige Verbindungsdaten (z. B. IP-Adresse, Zeitpunkt, User-Agent, Referrer, angeforderte Ressource) zur Sicherstellung des Betriebs und zur Missbrauchserkennung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO."
            : "When visiting this website, the hosting provider processes technically required connection data (for example IP address, timestamp, user-agent, referrer, requested resource) to ensure service stability and abuse prevention. Legal basis: Art. 6 para. 1 lit. f GDPR."}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "3. Kontaktaufnahme" : "3. Contact requests"}</h2>
        <p>
          {locale === "de"
            ? "Wenn Sie uns per E-Mail oder telefonisch kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage und für Anschlussfragen."
            : "If you contact us via email or phone, we process your data to handle your request and related follow-ups."}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "4. Cookies und ähnliche Technologien" : "4. Cookies and similar technologies"}</h2>
        <p>
          {locale === "de"
            ? "Diese Website setzt aktuell nur technisch erforderliche Funktionen ein. Tracking- oder Marketing-Cookies werden derzeit nicht aktiv eingesetzt."
            : "This website currently uses only technically required functionality. Tracking or marketing cookies are not actively used at this time."}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "5. Ihre Rechte" : "5. Your rights"}</h2>
        <p>
          {locale === "de"
            ? "Sie haben nach DSGVO insbesondere das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch."
            : "Under the GDPR you have rights including access, rectification, erasure, restriction, data portability and objection."}
        </p>
      </section>
    </LegalLayout>
  );
}
