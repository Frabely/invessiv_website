import {
  COMPANY,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_SOCIAL_X,
} from "@/config/company";
import type { Locale } from "@/config/i18n";
import { SITE_URL } from "@/lib/site-metadata";

const PHONE_DISPLAY_BY_LOCALE: Record<Locale, string> = {
  de: COMPANY.contact.phoneDisplayDe,
  en: COMPANY.contact.phoneDisplayEn,
};

const SERVICE_TYPE_BY_LOCALE: Record<Locale, string> = {
  de: "Webentwicklung, Landingpages und Prozess-Tools",
  en: "Web development, landing pages, and process tools",
};

export function createMarketingStructuredData(
  locale: Locale,
  description: string,
) {
  const organizationId = `${SITE_URL}#organization`;
  const phoneDisplay = PHONE_DISPLAY_BY_LOCALE[locale];
  const serviceType = SERVICE_TYPE_BY_LOCALE[locale];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: COMPANY.brandName,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/icon.png`,
        email: COMPANY.contact.email,
        telephone: phoneDisplay,
        sameAs: [
          COMPANY_SOCIAL_LINKEDIN,
          COMPANY_SOCIAL_X,
          COMPANY_SOCIAL_INSTAGRAM,
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: COMPANY.brandName,
        url: SITE_URL,
        inLanguage: ["de", "en"],
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "Service",
        serviceType,
        provider: {
          "@id": organizationId,
        },
        areaServed: "DE",
        availableLanguage: ["de", "en"],
        description,
      },
    ],
  };
}
