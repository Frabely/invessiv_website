import { COMPANY } from "@/config/company";
import type { Locale } from "@/config/i18n";
import { SITE_URL } from "@/lib/site-metadata";

export function createMarketingStructuredData(
  locale: Locale,
  description: string,
) {
  const phoneDisplay =
    locale === "de"
      ? COMPANY.contact.phoneDisplayDe
      : COMPANY.contact.phoneDisplayEn;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: COMPANY.legalName,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/icon.png`,
        email: COMPANY.contact.email,
        telephone: phoneDisplay,
      },
      {
        "@type": "Service",
        serviceType: "Web design and web development",
        provider: {
          "@type": "Organization",
          name: COMPANY.legalName,
          url: SITE_URL,
        },
        areaServed: "DE",
        availableLanguage: ["de", "en"],
        description,
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: 99,
          },
        },
      },
    ],
  };
}
