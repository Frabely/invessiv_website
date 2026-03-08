import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermsContent } from "@/components/legal/terms-content/terms-content";
import { TermsLayout } from "@/components/legal/terms-layout/terms-layout";
import { COMPANY, COMPANY_MAILTO } from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_URL } from "@/lib/site-metadata";

type AgbPageProps = {
  params: Promise<{ locale: string }>;
};

type TermsSectionKey = Exclude<keyof Dictionary["terms"]["sections"], "provider">;

const TERMS_SECTION_CONFIG: Array<{ id: string; key: TermsSectionKey }> = [
  { id: "scope", key: "scope" },
  { id: "contract-conclusion", key: "contractConclusion" },
  { id: "services-scope", key: "servicesScope" },
  { id: "client-cooperation", key: "clientCooperation" },
  { id: "payment", key: "payment" },
  { id: "acceptance", key: "acceptance" },
  { id: "usage-rights", key: "usageRights" },
  { id: "third-party-services", key: "thirdPartyServices" },
  { id: "liability", key: "liability" },
  { id: "confidentiality", key: "confidentiality" },
  { id: "final-provisions", key: "finalProvisions" },
];

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AgbPageProps): Promise<Metadata> {
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
      canonical: `/${locale}/agb`,
      languages: {
        de: "/de/agb",
        en: "/en/agb",
      },
    },
    openGraph: {
      title: terms.meta.openGraphTitle,
      description: terms.meta.description,
      url: `${SITE_URL}/${locale}/agb`,
      locale: terms.meta.openGraphLocale,
      type: "website",
    },
  };
}

export default async function AgbPage({ params }: AgbPageProps) {
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
            {terms.sections.provider.contractPrefix} {COMPANY.brandName}, {terms.sections.provider.representedByLabel}{" "}
            {COMPANY.owner}, {terms.sections.provider.addressLine}.
          </p>
          <p>
            {terms.sections.provider.emailLabel}: <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
          </p>
        </>
      ),
    },
    ...TERMS_SECTION_CONFIG.map(({ id, key }) => ({
      id,
      title: terms.sections[key].title,
      body: <p>{terms.sections[key].body}</p>,
    })),
  ];

  return (
    <TermsLayout
      breadcrumbAriaLabel={terms.page.breadcrumbAriaLabel}
      homeLabel={terms.page.homeLabel}
      lead={terms.page.lead}
      locale={locale}
      title={terms.page.title}
      updatedAt={terms.page.updatedAt}
    >
      <TermsContent
        copySectionLinkLabel={terms.page.copySectionLinkLabel}
        sectionLinkCopiedLabel={terms.page.sectionLinkCopiedLabel}
        sections={sections}
        tocLabel={terms.page.tocLabel}
      />
    </TermsLayout>
  );
}
