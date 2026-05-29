import {
  COMPANY,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
} from "@/config/company";
import type { Locale } from "@/config/i18n";
import { getLinkedInPostMetaContent } from "@/i18n/dictionaries/linkedin-post/meta";
import { SITE_LOGO_URL, SITE_URL } from "@/lib/site-metadata";

const PHONE_DISPLAY_BY_LOCALE: Record<Locale, string> = {
  de: COMPANY.contact.phoneDisplayDe,
  en: COMPANY.contact.phoneDisplayEn,
};

export function createLinkedInPostStructuredData(locale: Locale) {
  const organizationId = `${SITE_URL}#organization`;
  const pageUrl = `${SITE_URL}/${locale}/services/linkedin-post`;
  const servicesUrl = `${SITE_URL}/${locale}#services`;
  const applicationId = `${pageUrl}#application`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const meta = getLinkedInPostMetaContent(locale);
  const { structuredData } = meta;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: COMPANY.brandName,
        url: SITE_URL,
        logo: SITE_LOGO_URL,
        email: COMPANY.contact.email,
        telephone: PHONE_DISPLAY_BY_LOCALE[locale],
        sameAs: [COMPANY_SOCIAL_LINKEDIN, COMPANY_SOCIAL_INSTAGRAM],
      },
      {
        "@type": "SoftwareApplication",
        "@id": applicationId,
        name: structuredData.applicationName,
        applicationCategory: structuredData.applicationCategory,
        operatingSystem: structuredData.operatingSystem,
        url: pageUrl,
        description: meta.description,
        provider: {
          "@id": organizationId,
        },
        featureList: structuredData.featureList,
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: structuredData.breadcrumbs.home,
            item: `${SITE_URL}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: structuredData.breadcrumbs.services,
            item: servicesUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: structuredData.breadcrumbs.service,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}
