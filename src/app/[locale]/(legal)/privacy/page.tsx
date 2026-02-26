import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal/legal-layout/legal-layout";
import {
  COMPANY,
  COMPANY_ADDRESS_LINE_EN,
  COMPANY_MAILTO,
  COMPANY_TEL,
} from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_URL } from "@/lib/site-metadata";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const privacy = dict.privacy;

  return {
    title: privacy.meta.title,
    description: privacy.meta.description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        de: "/de/privacy",
        en: "/en/privacy",
      },
    },
    openGraph: {
      title: privacy.meta.openGraphTitle,
      description: privacy.meta.description,
      url: `${SITE_URL}/${locale}/privacy`,
      locale: privacy.meta.openGraphLocale,
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const privacy = dict.privacy;
  const addressLine = COMPANY_ADDRESS_LINE_EN;

  return (
    <LegalLayout
      lead={privacy.page.lead}
      locale={locale}
      title={privacy.page.title}
      updatedAt={privacy.page.updatedAt}
    >
      <section className="legal-content-card">
        <div className="legal-content-card__group">
          <h3>{privacy.sections.controller.title}</h3>
          <p>
            {COMPANY.brandName}, {privacy.sections.controller.ownerLabel}: {COMPANY.owner}
            <br />
            {addressLine}
            <br />
            E-Mail: <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
            <br />
            {privacy.sections.controller.phoneLabel}:{" "}
            <a href={COMPANY_TEL}>
              {COMPANY.contact.phoneDisplayEn}
            </a>
          </p>
        </div>

        <div className="legal-content-card__group">
          <h3>{privacy.sections.hosting.title}</h3>
          <p>{privacy.sections.hosting.body}</p>
        </div>

        <div className="legal-content-card__group">
          <h3>{privacy.sections.contactRequests.title}</h3>
          <p>{privacy.sections.contactRequests.body}</p>
        </div>

        <div className="legal-content-card__group">
          <h3>{privacy.sections.cookies.title}</h3>
          <p>{privacy.sections.cookies.body}</p>
        </div>

        <div className="legal-content-card__group">
          <h3>{privacy.sections.rights.title}</h3>
          <p>{privacy.sections.rights.body}</p>
        </div>
      </section>
    </LegalLayout>
  );
}
