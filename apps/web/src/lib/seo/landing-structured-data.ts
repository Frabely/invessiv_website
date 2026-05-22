import {
  COMPANY,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
} from "@/config/company";
import type { Locale } from "@/config/i18n";
import { getLandingFaqContent } from "@/i18n/dictionaries/landing/faq";
import { getLandingMetaContent } from "@/i18n/dictionaries/landing/meta";
import { getLandingPricingContent } from "@/i18n/dictionaries/landing/pricing";
import { getLandingStructuredDataContent } from "@/i18n/dictionaries/landing/structured-data";
import { SITE_LOGO_URL, SITE_URL } from "@/lib/site-metadata";

type LeadTime = {
  "@type": "QuantitativeValue";
  maxValue: number;
  minValue: number;
  unitCode: "DAY";
};

const PHONE_DISPLAY_BY_LOCALE: Record<Locale, string> = {
  de: COMPANY.contact.phoneDisplayDe,
  en: COMPANY.contact.phoneDisplayEn,
};

export function parsePriceRange(
  priceValue: string,
  priceRangePrefix: string,
  priceRangeCurrencySymbol: string,
): string {
  const amount = priceValue.match(/\d[\d.\s]*/)?.[0]?.replace(/\s/g, "");

  return amount
    ? `${priceRangePrefix} ${amount} ${priceRangeCurrencySymbol}`
    : priceValue;
}

export function parseLeadTime(durationValue: string): LeadTime {
  const [minValue, maxValue] = [...durationValue.matchAll(/\d+/g)].map(
    ([value]) => Number(value),
  );

  if (!minValue || !maxValue) {
    throw new Error(`Unable to parse landing page lead time: ${durationValue}`);
  }

  return {
    "@type": "QuantitativeValue",
    minValue,
    maxValue,
    unitCode: "DAY",
  };
}

export function createLandingStructuredData(locale: Locale) {
  const organizationId = `${SITE_URL}#organization`;
  const pageUrl = `${SITE_URL}/${locale}/services/landing-page`;
  const servicesUrl = `${SITE_URL}/${locale}#services`;
  const serviceId = `${pageUrl}#service`;
  const faqId = `${pageUrl}#faq`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const structuredData = getLandingStructuredDataContent(locale);
  const meta = getLandingMetaContent(locale);
  const pricing = getLandingPricingContent(locale);
  const faq = getLandingFaqContent(locale);
  const priceRange = parsePriceRange(
    pricing.card.priceValue,
    structuredData.offer.priceRangePrefix,
    structuredData.offer.priceRangeCurrencySymbol,
  );
  const deliveryLeadTime = parseLeadTime(pricing.card.durationValue);

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
        "@type": "Service",
        "@id": serviceId,
        name: structuredData.service.name,
        serviceType: structuredData.service.serviceType,
        provider: {
          "@id": organizationId,
        },
        areaServed: {
          "@type": "Country",
          name: structuredData.areaServed.countryCode,
        },
        audience: {
          "@type": "BusinessAudience",
          audienceType: structuredData.audienceType,
        },
        description: meta.description,
        offers: {
          "@type": "Offer",
          name: pricing.card.planTitle,
          priceCurrency: structuredData.offer.priceCurrency,
          priceRange,
          availability: "https://schema.org/InStock",
          deliveryLeadTime,
          itemOffered: {
            "@id": serviceId,
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        mainEntity: faq.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
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
