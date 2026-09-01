import {
  COMPANY,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
} from "@/config/company";
import type { QnaItemCopy } from "@/common/contracts/marketing/qna-copy";
import type { Locale } from "@/config/i18n";
import { FAQ_SECTION_ID } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { SITE_LOGO_URL, SITE_URL } from "@/lib/site-metadata";

const PHONE_DISPLAY_BY_LOCALE: Record<Locale, string> = {
  de: COMPANY.contact.phoneDisplayDe,
  en: COMPANY.contact.phoneDisplayEn,
};

const SERVICE_TYPE_BY_LOCALE: Record<Locale, string> = {
  de: "Webdesign für KMU und Dienstleister",
  en: "Web design for SMBs and service providers",
};

export function createMarketingStructuredData(
  locale: Locale,
  description: string,
  faqItems: QnaItemCopy[],
) {
  const organizationId = `${SITE_URL}#organization`;
  const homeUrl = `${SITE_URL}${createLocalePathname(SITE_ROUTES.HOME, locale)}`;
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
        logo: SITE_LOGO_URL,
        email: COMPANY.contact.email,
        telephone: phoneDisplay,
        sameAs: [COMPANY_SOCIAL_LINKEDIN, COMPANY_SOCIAL_INSTAGRAM],
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
      {
        "@type": "FAQPage",
        "@id": `${homeUrl}#${FAQ_SECTION_ID}`,
        inLanguage: locale,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
