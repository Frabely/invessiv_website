import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OPEN_GRAPH_LOCALE } from "@invessiv/common";
import { LegalDocumentContent } from "@/components/legal/legal-document-content/legal-document-content";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout/legal-document-layout";
import {
  COMPANY,
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
} from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  createPageMetadata,
  createRouteAlternates,
} from "@/lib/seo/page-metadata";

type ImprintPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: ImprintPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  return {
    ...createPageMetadata({
      title: dict.imprint.meta.title,
      description: dict.imprint.meta.description,
      canonicalPath: createLocalePathname(SITE_ROUTES.IMPRINT, locale),
      languages: createRouteAlternates(SITE_ROUTES.IMPRINT),
      openGraphTitle: dict.imprint.meta.openGraphTitle,
      openGraphLocale: OPEN_GRAPH_LOCALE[locale],
    }),
    robots: { index: false, follow: true },
  };
}

export default async function ImprintPage({ params }: ImprintPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const imprint = dict.imprint;
  const phoneHref = `tel:${imprint.values.phoneDisplay.replace(/\s+/g, "")}`;
  const sections = [
    {
      id: "provider",
      title: imprint.sections.provider.title,
      body: (
        <>
          <p>
            <strong>{imprint.sections.provider.labels.company}:</strong>{" "}
            {COMPANY.brandName}
          </p>
          <p>
            <strong>{imprint.sections.provider.labels.representedBy}:</strong>{" "}
            {COMPANY.owner}
          </p>
          <p>
            <strong>{imprint.sections.provider.labels.address}:</strong>{" "}
            {imprint.values.addressLine}
          </p>
          <p>
            <strong>{imprint.sections.contact.labels.phone}:</strong>{" "}
            <a href={phoneHref}>{imprint.values.phoneDisplay}</a>
          </p>
          <p>
            <strong>{imprint.sections.contact.labels.email}:</strong>{" "}
            <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          </p>
        </>
      ),
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
            <a href={COMPANY_SOCIAL_INSTAGRAM} rel="noreferrer" target="_blank">
              Instagram
            </a>
          </li>
        </ul>
      ),
    },
  ];

  return (
    <LegalDocumentLayout
      breadcrumbAriaLabel={imprint.page.breadcrumbAriaLabel}
      homeLabel={imprint.page.homeLabel}
      lead={imprint.page.lead}
      locale={locale}
      title={imprint.page.title}
      updatedAt={imprint.page.updatedAt}
    >
      <LegalDocumentContent
        sections={sections}
        tocLabel={imprint.page.tocLabel}
      />
    </LegalDocumentLayout>
  );
}
