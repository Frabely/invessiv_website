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

type ImprintPageProps = {
  params: Promise<{ locale: string }>;
};

const imprintMeta = {
  de: {
    title: "Impressum",
    description: "Impressum und Anbieterkennzeichnung von Invessiv.",
    openGraphTitle: "Impressum | Invessiv",
  },
  en: {
    title: "Imprint",
    description: "Imprint and provider details of Invessiv.",
    openGraphTitle: "Imprint | Invessiv",
  },
} as const;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ImprintPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const meta = imprintMeta[locale];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}/imprint`,
      languages: {
        de: "/de/imprint",
        en: "/en/imprint",
      },
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.description,
      url: `${SITE_URL}/${locale}/imprint`,
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function ImprintPage({ params }: ImprintPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const contentByLocale: Record<
    Locale,
    { lead: string; title: string; addressLine: string }
  > = {
    de: {
      title: "Impressum",
      lead: "Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.",
      addressLine: COMPANY_ADDRESS_LINE_DE,
    },
    en: {
      title: "Imprint",
      lead: "Information according to Section 5 TMG and Section 18 para. 2 MStV.",
      addressLine: COMPANY_ADDRESS_LINE_EN,
    },
  };

  const content = contentByLocale[locale];

  return (
    <LegalLayout lead={content.lead} locale={locale} slug="imprint" title={content.title}>
      <section id="company-details">
        <h2>{locale === "de" ? "Anbieter" : "Provider"}</h2>
        <p>
          <strong>{locale === "de" ? "Firma" : "Company"}:</strong> {COMPANY.brandName}
          <br />
          <strong>{locale === "de" ? "Rechtsform" : "Legal form"}:</strong>{" "}
          {COMPANY.legalForm[locale]}
          <br />
          <strong>{locale === "de" ? "Vertreten durch" : "Represented by"}:</strong>{" "}
          {COMPANY.owner}
          <br />
          <strong>{locale === "de" ? "Adresse" : "Address"}:</strong> {content.addressLine}
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "Kontakt" : "Contact"}</h2>
        <p>
          E-Mail: <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          <br />
          {locale === "de" ? "Telefon" : "Phone"}:{" "}
          <a href={COMPANY_TEL}>
            {locale === "de" ? COMPANY.contact.phoneDisplayDe : COMPANY.contact.phoneDisplayEn}
          </a>
        </p>
      </section>

      <section>
        <h2>{locale === "de" ? "Registereintrag" : "Commercial register"}</h2>
        <p>{locale === "de" ? "Kein Handelsregistereintrag." : "No commercial register entry."}</p>
      </section>

      <section>
        <h2>{locale === "de" ? "Verantwortlich für den Inhalt" : "Responsible for content"}</h2>
        <p>
          {COMPANY.owner}
          <br />
          {content.addressLine}
        </p>
      </section>

      <section id="placeholder-social-linkedin">
        <h2>{locale === "de" ? "Social-Profile (noch ergänzen)" : "Social profiles (to be added)"}</h2>
        <ul>
          <li className="legal-placeholder">[PLACEHOLDER: LinkedIn profile URL]</li>
          <li className="legal-placeholder" id="placeholder-social-x">
            [PLACEHOLDER: X/Twitter profile URL]
          </li>
          <li className="legal-placeholder" id="placeholder-social-instagram">
            [PLACEHOLDER: Instagram profile URL]
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
