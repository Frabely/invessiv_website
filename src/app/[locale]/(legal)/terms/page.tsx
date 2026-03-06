import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermsContent } from "@/components/legal/terms-content/terms-content";
import { TermsLayout } from "@/components/legal/terms-layout/terms-layout";
import { COMPANY } from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_URL } from "@/lib/site-metadata";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
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
      canonical: `/${locale}/terms`,
      languages: {
        de: "/de/terms",
        en: "/en/terms",
      },
    },
    openGraph: {
      title: terms.meta.openGraphTitle,
      description: terms.meta.description,
      url: `${SITE_URL}/${locale}/terms`,
      locale: terms.meta.openGraphLocale,
      type: "website",
    },
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
        <p>
          {terms.sections.provider.contractPrefix} {COMPANY.legalName},{" "}
          {terms.sections.provider.representedByLabel} {COMPANY.owner},{" "}
          {terms.sections.provider.addressLine}.
        </p>
      ),
    },
    {
      id: "scope",
      title: terms.sections.scope.title,
      body: <p>{terms.sections.scope.body}</p>,
    },
    {
      id: "services",
      title: terms.sections.services.title,
      body: <p>{terms.sections.services.body}</p>,
    },
    {
      id: "payment",
      title: terms.sections.payment.title,
      body: <p>{terms.sections.payment.body}</p>,
    },
    {
      id: "usage-rights",
      title: terms.sections.usageRights.title,
      body: <p>{terms.sections.usageRights.body}</p>,
    },
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
