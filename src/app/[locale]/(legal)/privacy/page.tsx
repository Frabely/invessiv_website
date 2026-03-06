import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermsContent } from "@/components/legal/terms-content/terms-content";
import { TermsLayout } from "@/components/legal/terms-layout/terms-layout";
import {
  COMPANY,
  COMPANY_ADDRESS_LINE_DE,
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
  const addressLine =
    locale === "de" ? COMPANY_ADDRESS_LINE_DE : COMPANY_ADDRESS_LINE_EN;
  const phoneDisplay =
    locale === "de" ? COMPANY.contact.phoneDisplayDe : COMPANY.contact.phoneDisplayEn;
  const sections = [
    {
      id: "controller",
      title: privacy.sections.controller.title,
      body: (
        <>
          <p>
            {COMPANY.legalName}, {privacy.sections.controller.ownerLabel}: {COMPANY.owner}
          </p>
          <p>{addressLine}</p>
          <p>
            {privacy.sections.controller.emailLabel}: <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          </p>
          <p>
            {privacy.sections.controller.phoneLabel}: <a href={COMPANY_TEL}>{phoneDisplay}</a>
          </p>
        </>
      ),
    },
    {
      id: "hosting",
      title: privacy.sections.hosting.title,
      body: <p>{privacy.sections.hosting.body}</p>,
    },
    {
      id: "contact-requests",
      title: privacy.sections.contactRequests.title,
      body: <p>{privacy.sections.contactRequests.body}</p>,
    },
    {
      id: "cookies",
      title: privacy.sections.cookies.title,
      body: <p>{privacy.sections.cookies.body}</p>,
    },
    {
      id: "rights",
      title: privacy.sections.rights.title,
      body: <p>{privacy.sections.rights.body}</p>,
    },
  ];

  return (
    <TermsLayout
      breadcrumbAriaLabel={privacy.page.breadcrumbAriaLabel}
      homeLabel={privacy.page.homeLabel}
      lead={privacy.page.lead}
      locale={locale}
      title={privacy.page.title}
      updatedAt={privacy.page.updatedAt}
    >
      <TermsContent
        copySectionLinkLabel={privacy.page.copySectionLinkLabel}
        sectionLinkCopiedLabel={privacy.page.sectionLinkCopiedLabel}
        sections={sections}
        tocLabel={privacy.page.tocLabel}
      />
    </TermsLayout>
  );
}
