import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OPEN_GRAPH_LOCALE } from "@invessiv/common";
import { LegalDocumentContent } from "@/components/legal/legal-document-content/legal-document-content";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout/legal-document-layout";
import { COMPANY, COMPANY_MAILTO } from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  createPageMetadata,
  createRouteAlternates,
} from "@/lib/seo/page-metadata";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

type TermsSectionKey = Exclude<
  keyof Dictionary["terms"]["sections"],
  "provider"
>;

const TERMS_SECTION_CONFIG: Array<{ id: string; key: TermsSectionKey }> = [
  { id: "scope", key: "scope" },
  { id: "contract-conclusion", key: "contractConclusion" },
  { id: "services-scope", key: "servicesScope" },
  { id: "client-cooperation", key: "clientCooperation" },
  { id: "payment", key: "payment" },
  { id: "consumer-contracts", key: "consumerContracts" },
  { id: "acceptance", key: "acceptance" },
  { id: "customer-content-rights", key: "customerContentRights" },
  { id: "legal-texts-review", key: "legalTextsReview" },
  { id: "usage-rights", key: "usageRights" },
  { id: "third-party-services", key: "thirdPartyServices" },
  {
    id: "ongoing-support-availability",
    key: "ongoingSupportAvailability",
  },
  { id: "liability", key: "liability" },
  { id: "confidentiality", key: "confidentiality" },
  { id: "final-provisions", key: "finalProvisions" },
];

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const terms = dict.terms;

  return {
    ...createPageMetadata({
      title: terms.meta.title,
      description: terms.meta.description,
      canonicalPath: createLocalePathname(SITE_ROUTES.TERMS, locale),
      languages: createRouteAlternates(SITE_ROUTES.TERMS),
      openGraphTitle: terms.meta.openGraphTitle,
      openGraphLocale: OPEN_GRAPH_LOCALE[locale],
    }),
    robots: { index: false, follow: true },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const terms = dict.terms;
  const sections = [
    {
      id: "provider",
      title: terms.sections.provider.title,
      body: (
        <>
          <p>
            <strong>{terms.sections.provider.labels.company}:</strong>{" "}
            {COMPANY.brandName}
          </p>
          <p>
            <strong>{terms.sections.provider.labels.owner}:</strong>{" "}
            {COMPANY.owner}
          </p>
          <p>
            <strong>{terms.sections.provider.labels.address}:</strong>{" "}
            {terms.sections.provider.addressLine}
          </p>
          <p>
            <strong>{terms.sections.provider.labels.email}:</strong>{" "}
            <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          </p>
        </>
      ),
    },
    ...TERMS_SECTION_CONFIG.flatMap(({ id, key }) => {
      const section = terms.sections[key];

      return section
        ? [{ id, title: section.title, body: <p>{section.body}</p> }]
        : [];
    }),
  ];

  return (
    <LegalDocumentLayout
      breadcrumbAriaLabel={terms.page.breadcrumbAriaLabel}
      homeLabel={terms.page.homeLabel}
      lead={terms.page.lead}
      locale={locale}
      title={terms.page.title}
      updatedAt={terms.page.updatedAt}
    >
      <LegalDocumentContent
        sections={sections}
        tocLabel={terms.page.tocLabel}
      />
    </LegalDocumentLayout>
  );
}
