import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentContent } from "@/components/legal/legal-document-content/legal-document-content";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout/legal-document-layout";
import { COMPANY, COMPANY_MAILTO } from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  createLocaleAlternates,
  createPageMetadata,
} from "@/lib/seo/page-metadata";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const privacy = dict.privacy;

  return createPageMetadata({
    title: privacy.meta.title,
    description: privacy.meta.description,
    canonicalPath: `/${locale}/privacy`,
    languages: createLocaleAlternates(
      Object.fromEntries(
        SUPPORTED_LOCALES.map((supportedLocale) => [
          supportedLocale,
          `/${supportedLocale}/privacy`,
        ]),
      ),
    ),
    openGraphTitle: privacy.meta.openGraphTitle,
    openGraphLocale: privacy.meta.openGraphLocale,
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const privacy = dict.privacy;
  const phoneHref = `tel:${privacy.sections.controller.phoneDisplay.replace(/\s+/g, "")}`;
  const sections = [
    {
      id: "controller",
      title: privacy.sections.controller.title,
      body: (
        <>
          <p>{COMPANY.brandName}</p>
          <p>
            {privacy.sections.controller.ownerLabel}: {COMPANY.owner}
          </p>
          <p>{privacy.sections.controller.addressLine}</p>
          <p>
            {privacy.sections.controller.emailLabel}:{" "}
            <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          </p>
          <p>
            {privacy.sections.controller.phoneLabel}:{" "}
            <a href={phoneHref}>{privacy.sections.controller.phoneDisplay}</a>
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
      id: "vercel-analytics",
      title: privacy.sections.vercelAnalytics.title,
      body: <p>{privacy.sections.vercelAnalytics.body}</p>,
    },
    {
      id: "speed-insights",
      title: privacy.sections.speedInsights.title,
      body: <p>{privacy.sections.speedInsights.body}</p>,
    },
    {
      id: "contact",
      title: privacy.sections.contact.title,
      body: <p>{privacy.sections.contact.body}</p>,
    },
    {
      id: "appointments",
      title: privacy.sections.appointments.title,
      body: <p>{privacy.sections.appointments.body}</p>,
    },
    {
      id: "cookies",
      title: privacy.sections.cookies.title,
      body: <p>{privacy.sections.cookies.body}</p>,
    },
    {
      id: "recipients",
      title: privacy.sections.recipients.title,
      body: <p>{privacy.sections.recipients.body}</p>,
    },
    {
      id: "storage",
      title: privacy.sections.storage.title,
      body: <p>{privacy.sections.storage.body}</p>,
    },
    {
      id: "third-country-transfers",
      title: privacy.sections.thirdCountryTransfers.title,
      body: <p>{privacy.sections.thirdCountryTransfers.body}</p>,
    },
    {
      id: "rights",
      title: privacy.sections.rights.title,
      body: <p>{privacy.sections.rights.body}</p>,
    },
    {
      id: "complaints",
      title: privacy.sections.complaints.title,
      body: <p>{privacy.sections.complaints.body}</p>,
    },
  ];

  return (
    <LegalDocumentLayout
      breadcrumbAriaLabel={privacy.page.breadcrumbAriaLabel}
      homeLabel={privacy.page.homeLabel}
      lead={privacy.page.lead}
      locale={locale}
      title={privacy.page.title}
      updatedAt={privacy.page.updatedAt}
    >
      <LegalDocumentContent
        sections={sections}
        tocLabel={privacy.page.tocLabel}
      />
    </LegalDocumentLayout>
  );
}
