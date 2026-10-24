import {
  COMPANY,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_SOCIAL_LINKEDIN_ORGANIZATION,
} from "@/config/company";
import type { QnaItemCopy } from "@/common/contracts/marketing/qna-copy";
import type { Locale } from "@/config/i18n";
import { FAQ_SECTION_ID } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { SITE_LOGO_URL, SITE_URL } from "@/lib/site-metadata";
import { getHomeMetaContent } from "@/i18n/dictionaries/marketing/home-meta";

export function createMarketingStructuredData(
  locale: Locale,
  content: {
    description: string;
    serviceName: string;
    serviceType: string;
  },
  faqItems: QnaItemCopy[],
) {
  const organizationId = `${SITE_URL}#organization`;
  const personId = `${SITE_URL}#moritz-hecht`;
  const homeUrl = `${SITE_URL}${createLocalePathname(SITE_ROUTES.HOME, locale)}`;
  const { imageAlt, squareImageUrl } = getHomeMetaContent(locale);
  const primaryImageId = `${homeUrl}#primary-image`;
  const phoneDisplayByLocale: Record<Locale, string> = {
    de: COMPANY.contact.phoneDisplayDe,
    en: COMPANY.contact.phoneDisplayEn,
  };
  const phoneDisplay = phoneDisplayByLocale[locale];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ImageObject",
        "@id": primaryImageId,
        url: new URL(squareImageUrl, SITE_URL).toString(),
        width: 1200,
        height: 1200,
        caption: imageAlt,
        inLanguage: locale,
      },
      {
        "@type": "WebPage",
        "@id": `${homeUrl}#webpage`,
        url: homeUrl,
        description: content.description,
        inLanguage: locale,
        isPartOf: { "@id": `${SITE_URL}#website` },
        primaryImageOfPage: { "@id": primaryImageId },
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: COMPANY.brandName,
        legalName: COMPANY.legalName,
        url: SITE_URL,
        logo: SITE_LOGO_URL,
        email: COMPANY.contact.email,
        telephone: phoneDisplay,
        sameAs: [
          COMPANY_SOCIAL_LINKEDIN_ORGANIZATION,
          COMPANY_SOCIAL_INSTAGRAM,
        ],
        founder: {
          "@id": personId,
        },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: COMPANY.owner,
        url: homeUrl,
        image: `${SITE_URL}/assets/moritz-hecht.jpeg`,
        sameAs: [COMPANY_SOCIAL_LINKEDIN],
        worksFor: {
          "@id": organizationId,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: COMPANY.brandName,
        alternateName: "invessiv.com",
        url: SITE_URL,
        inLanguage: ["de", "en"],
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "Service",
        "@id": `${homeUrl}#webdesign-service`,
        name: content.serviceName,
        url: homeUrl,
        serviceType: content.serviceType,
        provider: {
          "@id": organizationId,
        },
        areaServed: [
          {
            "@type": "City",
            name: COMPANY.address.city,
          },
          {
            "@type": "Country",
            name: COMPANY.address.country[locale],
          },
        ],
        availableLanguage: ["de", "en"],
        description: content.description,
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
