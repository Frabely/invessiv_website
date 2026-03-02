import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermsContent } from "@/components/legal/terms-content/terms-content";
import { TermsLayout } from "@/components/legal/terms-layout/terms-layout";
import {
  COMPANY,
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_SOCIAL_X,
  COMPANY_TEL,
} from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_URL } from "@/lib/site-metadata";

type ImprintPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ImprintPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}/imprint`,
    ]),
  );

  return {
    title: dict.imprint.meta.title,
    description: dict.imprint.meta.description,
    alternates: {
      canonical: `/${locale}/imprint`,
      languages,
    },
    openGraph: {
      title: dict.imprint.meta.openGraphTitle,
      description: dict.imprint.meta.description,
      url: `${SITE_URL}/${locale}/imprint`,
      locale: dict.imprint.meta.openGraphLocale,
      type: "website",
    },
  };
}

export default async function ImprintPage({ params }: ImprintPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const imprint = dict.imprint;
  const sections = [
    {
      id: "provider",
      title: imprint.sections.provider.title,
      body: (
        <>
          <p>
            <strong>{imprint.sections.provider.labels.company}:</strong> {COMPANY.legalName}
          </p>
          <p>
            <strong>{imprint.sections.provider.labels.representedBy}:</strong> {COMPANY.owner}
          </p>
          <p>
            <strong>{imprint.sections.provider.labels.address}:</strong> {imprint.values.addressLine}
          </p>
          <p>
            <strong>{imprint.sections.contact.labels.phone}:</strong>{" "}
            <a href={COMPANY_TEL}>{imprint.values.phoneDisplay}</a>
          </p>
          <p>
            <strong>{imprint.sections.contact.labels.email}:</strong>{" "}
            <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          </p>
          <p>
            <strong>{imprint.sections.vatId.title}:</strong> {imprint.sections.vatId.notePlaceholder}
          </p>
          <p>
            <strong>{imprint.sections.commercialRegister.title}:</strong>{" "}
            {imprint.sections.commercialRegister.emptyEntry}
          </p>
        </>
      ),
    },
    {
      id: "responsible-content",
      title: imprint.sections.responsibleContent.title,
      body: (
        <>
          <p>
            {imprint.sections.responsibleContent.labels.name}: {COMPANY.owner}
          </p>
          <p>
            {imprint.sections.responsibleContent.labels.address}: {imprint.values.addressLine}
          </p>
        </>
      ),
    },
    {
      id: "eu-dispute",
      title: imprint.sections.euDispute.title,
      body: (
        <p>
          {imprint.sections.euDispute.textBeforeLink}{" "}
          <a href="https://ec.europa.eu/consumers/odr/" rel="noreferrer" target="_blank">
            {imprint.sections.euDispute.linkLabel}
          </a>
          . {imprint.sections.euDispute.textAfterLink}
        </p>
      ),
    },
    {
      id: "consumer-dispute",
      title: imprint.sections.consumerDispute.title,
      body: <p>{imprint.sections.consumerDispute.body}</p>,
    },
    {
      id: "social",
      title: imprint.sections.social.title,
      body: (
        <ul>
          <li>
            <a href={COMPANY_SOCIAL_LINKEDIN} rel="noreferrer" target="_blank">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={COMPANY_SOCIAL_X} rel="noreferrer" target="_blank">
              X
            </a>
          </li>
          <li>
            <a href={COMPANY_SOCIAL_INSTAGRAM} rel="noreferrer" target="_blank">
              Instagram
            </a>
          </li>
        </ul>
      ),
    },
  ];

  return (
    <TermsLayout
      breadcrumbAriaLabel={imprint.page.breadcrumbAriaLabel}
      homeLabel={imprint.page.homeLabel}
      lead={imprint.page.lead}
      locale={locale}
      title={imprint.page.title}
      updatedAt={imprint.page.updatedAt}
    >
      <TermsContent
        copySectionLinkLabel={imprint.page.copySectionLinkLabel}
        sectionLinkCopiedLabel={imprint.page.sectionLinkCopiedLabel}
        sections={sections}
        tocLabel={imprint.page.tocLabel}
      />
    </TermsLayout>
  );
}
